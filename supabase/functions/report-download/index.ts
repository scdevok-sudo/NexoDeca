/**
 * report-download — URL firmada para descargar un reporte mensual ya generado (histórico).
 * Módulo: M9 · Reporte mensual YPF (spec §9: "permitir descargar reportes de meses anteriores")
 *
 * POST JSON { reportId: uuid }
 * Respuesta: { url: string } — URL firmada que vence a los 2 minutos.
 * Errores: 400 · 401 · 403 · 404 · 405.
 *
 * PERMISOS: Gerente y Capacitador (cualquier reporte del historial).
 * REGLA DE NEGOCIO: se descarga el archivo tal cual se generó (no se regenera): es lo que se le entregó a YPF.
 * El tipo de archivo sale del `formato` guardado (xlsx | pdf): el content-type lo fija el objeto al subirse (monthly-report)
 * y la extensión del nombre de descarga sale de acá. El bucket es privado y sin policies (0016): solo la service role lee los objetos.
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, errorToResponse, jsonResponse, notFound } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';

const FN = 'report-download';
const BUCKET = 'reportes-mensuales';
const URL_TTL_SECONDS = 120;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireRole(req, ['gerente', 'capacitador']);
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    const body = await readJsonLimited(req, 256);
    const reportId = typeof body.reportId === 'string' ? body.reportId : '';
    if (!UUID_RE.test(reportId)) throw badRequest('Reporte inválido');

    const admin = adminClient();
    const { data, error } = await admin
      .from('monthly_reports')
      .select('storage_path, anio, mes, version, formato')
      .eq('id', reportId)
      .maybeSingle();
    if (error) throw new HttpError(500, 'No se pudo leer el reporte');
    if (!data) throw notFound('El reporte no existe');

    const fileName = `reporte-ypf-${data.anio}-${String(data.mes).padStart(2, '0')}-v${data.version}.${data.formato}`; // 'xlsx' | 'pdf', según cómo se generó
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(data.storage_path, URL_TTL_SECONDS, { download: fileName });
    if (signError || !signed) throw new HttpError(500, 'No se pudo preparar la descarga');

    return jsonResponse(200, { url: signed.signedUrl });
  } catch (err) {
    log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
