/**
 * certificate-download — URL firmada para descargar el PDF de un certificado (uso interno).
 * Módulo: M7 · Certificados (spec §7, GET /certificates/{id}/download)
 *
 * POST JSON { certificateId: uuid }
 * Respuesta: { url: string } — URL firmada que vence a los 2 minutos.
 * Errores: 400 · 401 · 403 · 404 · 405.
 *
 * PERMISOS: Gerente y Capacitador (cualquier certificado, como el historial de Personal: spec §7).
 *   El Operario NO usa esta función: la consulta pública ya devuelve sus URLs firmadas (certificates-by-dni).
 *   Así se resuelve el "público por DNI si corresponde" de la API sin login (decisiones-pendientes.md #8).
 * Se puede descargar cualquier versión (vigente, reemplazada o anulada): es historial para auditoría.
 * El bucket es privado y sin policies (0016): solo la service role lee los objetos.
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, errorToResponse, jsonResponse, notFound } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';

const FN = 'certificate-download';
const BUCKET = 'certificados-pdf';
const URL_TTL_SECONDS = 120;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireRole(req, ['gerente', 'capacitador']);
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    const body = await readJsonLimited(req, 256);
    const certificateId = typeof body.certificateId === 'string' ? body.certificateId : '';
    if (!UUID_RE.test(certificateId)) throw badRequest('Certificado inválido');

    const admin = adminClient();
    const { data, error } = await admin
      .from('certificates')
      .select('storage_path, numero_registro')
      .eq('id', certificateId)
      .maybeSingle();
    if (error) throw new HttpError(500, 'No se pudo leer el certificado');
    if (!data) throw notFound('El certificado no existe');

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(data.storage_path, URL_TTL_SECONDS, { download: `certificado-${data.numero_registro}.pdf` });
    if (signError || !signed) throw new HttpError(500, 'No se pudo preparar la descarga');

    return jsonResponse(200, { url: signed.signedUrl });
  } catch (err) {
    log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
