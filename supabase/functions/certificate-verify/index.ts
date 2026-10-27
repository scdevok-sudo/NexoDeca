/**
 * certificate-verify — Verificación PÚBLICA (sin login) de un certificado por su id, a donde apunta el QR del PDF.
 * Módulo: M7 · Certificados (spec §7)
 *
 * POST JSON { id: uuid }
 * Respuesta 200: { nombreCompleto, temaNombre, fecha, nroRegistro, venceEl: string | null, estado: 'vigente' | 'vencido' | 'anulado' }
 * Respuesta 404: { message: 'No encontramos ese certificado' } — IGUAL si el id no existe o no es un UUID válido.
 * Errores: 405.
 *
 * PERMISOS: público (verify_jwt = false en config.toml). Usa la service role por dentro, a través de
 *   get_certificate_public (0024), que solo la ejecuta service_role.
 * REGLA DE NEGOCIO: confirma autenticidad, no es un canal de descarga: NO devuelve DNI ni URL del PDF.
 * REGLA DE NEGOCIO: un certificado 'reemplazado' se informa como 'anulado' (ese PDF ya no es el que vale).
 */

import { handleCors } from '../_shared/cors.ts';
import { HttpError, errorToResponse, jsonResponse, notFound } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';

const FN = 'certificate-verify';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = 'No encontramos ese certificado';

interface Row {
  nombre: string;
  apellido: string;
  tema: string;
  fecha_dictado: string;
  numero_registro: number;
  estado: 'vigente' | 'reemplazado' | 'anulado';
  vence_el: string | null;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');
    const body = await readJsonLimited(req, 256);
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!UUID_RE.test(id)) throw notFound(NOT_FOUND);

    const { data, error } = await adminClient().rpc('get_certificate_public', { p_id: id });
    if (error) throw new HttpError(500, 'No se pudo hacer la verificación');
    const row = ((data ?? []) as Row[])[0];
    if (!row) throw notFound(NOT_FOUND);

    // Hora de Argentina, igual que el resto del sistema.
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    let estado: 'vigente' | 'vencido' | 'anulado' = 'vigente';
    if (row.estado !== 'vigente') estado = 'anulado';
    else if (row.vence_el && row.vence_el < hoy) estado = 'vencido';

    log(FN, 'info', 'verificación ok', { estado });
    return jsonResponse(200, {
      nombreCompleto: `${row.nombre} ${row.apellido}`,
      temaNombre: row.tema,
      fecha: row.fecha_dictado,
      nroRegistro: row.numero_registro,
      venceEl: row.vence_el,
      estado,
    });
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 404)) log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
