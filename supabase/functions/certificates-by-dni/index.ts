/**
 * certificates-by-dni — Consulta PÚBLICA (sin login) de los certificados de una persona por DNI.
 * Módulo: M7 · Certificados (spec §7, GET /certificates/by-dni/{dni})
 *
 * ⚠️ Es el punto más sensible de privacidad de todo el sistema.
 *
 * POST JSON { dni: string } — el DNI va en el cuerpo y no en la URL, para que no quede en logs de acceso.
 * Respuesta 200: { certificados: [{ id, temaNombre, fecha, nroRegistro, downloadUrl }] }
 * Respuesta 404: { message: 'No encontramos certificados para ese DNI' } — IGUAL si el DNI no existe o no tiene
 *   certificados (decidido con Lucas, 2026-10-17, como pide la spec): no confirma ni niega que alguien trabaje en Deca.
 * Errores: 400 DNI con formato inválido · 405.
 *
 * PERMISOS: público (verify_jwt = false en config.toml). Usa la service role por dentro, a través de
 *   get_certificates_by_dni (0015), que solo acepta un DNI exacto (0020: ya no la ejecuta el cliente directo).
 * REGLA DE NEGOCIO: NUNCA listados, NUNCA búsqueda parcial ni por nombre. Nada de datos de otras personas.
 * REGLA DE NEGOCIO: solo certificados vigentes (los de capacitaciones anuladas quedan 'anulado', no se muestran).
 * Descarga: cada certificado trae una URL firmada que vence a los 10 minutos (el bucket es privado, 0016).
 * TODO(M7): rate limiting / protección contra enumeración de DNIs (la spec no lo pide; consultar a Santi).
 */

import { handleCors } from '../_shared/cors.ts';
import { HttpError, badRequest, errorToResponse, jsonResponse, notFound } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';
import { normalizeDni } from '../_shared/validation.ts';

const FN = 'certificates-by-dni';
const BUCKET = 'certificados-pdf';
const URL_TTL_SECONDS = 600;
const NOT_FOUND = 'No encontramos certificados para ese DNI';

interface Row {
  certificate_id: string;
  numero_registro: number;
  tema: string;
  fecha_dictado: string;
  storage_path: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    // Sin requireRole a propósito: es pública.
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');
    const body = await readJsonLimited(req, 256);
    const dni = typeof body.dni === 'string' ? normalizeDni(body.dni) : null;
    if (!dni) throw badRequest('Ingresá un DNI válido (7 u 8 números)');

    const admin = adminClient();
    const { data, error } = await admin.rpc('get_certificates_by_dni', { p_dni: dni });
    if (error) throw new HttpError(500, 'No se pudo hacer la consulta');
    const rows = (data ?? []) as Row[];
    // REGLA DE NEGOCIO: misma respuesta exista o no el DNI.
    if (rows.length === 0) throw notFound(NOT_FOUND);

    const certificados = [];
    for (const r of rows) {
      const fileName = `certificado-${r.numero_registro}.pdf`;
      const { data: signed, error: signError } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(r.storage_path, URL_TTL_SECONDS, { download: fileName });
      if (signError || !signed) throw new HttpError(500, 'No se pudo preparar la descarga');
      certificados.push({
        id: r.certificate_id,
        temaNombre: r.tema,
        fecha: r.fecha_dictado,
        nroRegistro: r.numero_registro,
        downloadUrl: signed.signedUrl,
      });
    }

    // No se loguea el DNI (dato personal): solo la cantidad.
    log(FN, 'info', 'consulta ok', { certificados: certificados.length });
    return jsonResponse(200, { certificados });
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 404)) log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
