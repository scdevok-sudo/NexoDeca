/**
 * monthly-report — Genera y guarda el reporte mensual para YPF.
 * Módulo: M9 · Reporte mensual YPF (spec §9, GET /reports/monthly/{year}/{month})
 *
 * POST JSON { year: number, month: number, formato?: 'xlsx' | 'pdf' }  (formato por defecto: 'xlsx')
 * Respuesta: { id, anio, mes, version, formato, createdAt, downloadUrl } — URL firmada que vence a los 2 minutos.
 * Errores: 400 año/mes inválidos o mes futuro · 401 · 403 · 405.
 *
 * Qué hace:
 *  1. Junta las capacitaciones del mes (tema, fecha, nro de registro, capacitador) y la nómina de participantes.
 *  2. Arma un Excel (exceljs, ver docs/decisiones-tecnicas.md) con tres hojas: Resumen, Capacitaciones y Nómina, o un
 *     PDF (pdf-lib, ./pdf.ts) con encabezado de empresa, resumen, capacitaciones y nómina.
 *  3. Lo sube al bucket privado 'reportes-mensuales' con un nombre único (nunca sobrescribe) y lo registra con su
 *     número de versión (RPC register_monthly_report, 0022). Si el registro falla, borra el archivo recién subido.
 *
 * PERMISOS: Gerente y Capacitador.
 * REGLA DE NEGOCIO: puede generarse con el mes en curso incompleto (el Resumen lo avisa). Un mes futuro, no.
 * REGLA DE NEGOCIO: el reporte queda guardado como archivo histórico; generar el mismo mes otra vez crea una versión
 *   nueva y la anterior queda (decidido con Lucas, 2026-10-17).
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): las capacitaciones anuladas aparecen en "Capacitaciones"
 *   marcadas como Anulada (así no hay huecos sin explicar en la numeración), pero sus participantes NO van a la nómina.
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, errorToResponse, jsonResponse } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';
import { buildReportFile, type TrainingRow } from './build.ts';

const FN = 'monthly-report';
const BUCKET = 'reportes-mensuales';
const URL_TTL_SECONDS = 120;

function hoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  let subido: string | null = null;
  const admin = adminClient();
  try {
    const caller = await requireRole(req, ['gerente', 'capacitador']);
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    const body = await readJsonLimited(req, 256);
    const formato = body.formato === undefined ? 'xlsx' : body.formato;
    if (formato !== 'xlsx' && formato !== 'pdf') throw badRequest('Formato inválido (xlsx o pdf)');
    const anio = Number(body.year);
    const mes = Number(body.month);
    if (!Number.isInteger(anio) || anio < 2020 || anio > 2100) throw badRequest('Año inválido');
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw badRequest('Mes inválido');

    const hoy = hoyArgentina();
    const mesActual = hoy.slice(0, 7);
    const mesPedido = `${anio}-${String(mes).padStart(2, '0')}`;
    if (mesPedido > mesActual) throw badRequest('No se puede generar el reporte de un mes futuro');
    const enCurso = mesPedido === mesActual;

    const desde = `${mesPedido}-01`;
    const hasta = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10); // último día del mes

    // Con service role: los permisos ya se chequearon (Gerente y Capacitador ven todo el reporte).
    const { data, error } = await admin
      .from('trainings')
      .select(
        'numero_registro, fecha_dictado, duracion_real, estado, training_topics(nombre), profiles(nombre), ' +
          'training_attendees(resultado, personnel(dni, nombre, apellido), positions(nombre))',
      )
      .gte('fecha_dictado', desde)
      .lte('fecha_dictado', hasta)
      .order('fecha_dictado')
      .order('numero_registro');
    if (error) throw new HttpError(500, 'No se pudieron leer las capacitaciones');
    const trainings = (data ?? []) as unknown as TrainingRow[];

    const { data: perfil } = await admin.from('profiles').select('nombre').eq('id', caller.id).maybeSingle();

    // ---------- Armado del archivo (Excel o PDF, ver build.ts)
    const built = await buildReportFile({
      formato,
      anio,
      mes,
      hoy,
      enCurso,
      generadoPor: perfil?.nombre ?? caller.email,
      trainings,
      cuit: Deno.env.get('EMPRESA_CUIT')?.trim() || null,
      domicilio: Deno.env.get('EMPRESA_DOMICILIO')?.trim() || null,
    });

    // ---------- Guardado histórico (nunca se pisa: nombre único + upsert false)
    const path = `${anio}/${String(mes).padStart(2, '0')}/${crypto.randomUUID()}.${formato}`;
    const { error: upError } = await admin.storage.from(BUCKET).upload(path, built.bytes, {
      contentType: built.contentType,
      upsert: false,
    });
    if (upError) throw new HttpError(500, 'No se pudo guardar el reporte');
    subido = path;

    const { data: reg, error: regError } = await admin.rpc('register_monthly_report', {
      p_anio: anio,
      p_mes: mes,
      p_storage_path: path,
      p_generado_por: caller.id,
      p_capacitaciones: built.capacitaciones,
      p_participantes: built.participantes,
      p_formato: formato,
    });
    const registro = (reg as { id: string; version: number }[] | null)?.[0];
    if (regError || !registro) throw new HttpError(500, 'No se pudo registrar el reporte');
    subido = null; // ya quedó registrado: no se borra

    const fileName = `reporte-ypf-${mesPedido}-v${registro.version}.${formato}`;
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, URL_TTL_SECONDS, { download: fileName });
    if (signError || !signed) throw new HttpError(500, 'El reporte se generó, pero no se pudo preparar la descarga');

    log(FN, 'info', 'reporte generado', {
      anio,
      mes,
      version: registro.version,
      por: caller.id,
    });
    return jsonResponse(200, {
      id: registro.id,
      anio,
      mes,
      version: registro.version,
      formato,
      createdAt: new Date().toISOString(),
      downloadUrl: signed.signedUrl,
    });
  } catch (err) {
    // Si el archivo se subió pero no quedó registrado, se borra para no dejar huérfanos.
    if (subido) {
      const { error: rmError } = await admin.storage.from(BUCKET).remove([subido]);
      if (rmError)
        log(FN, 'warn', 'no se pudo borrar un reporte huérfano', {
          path: subido,
        });
    }
    log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
