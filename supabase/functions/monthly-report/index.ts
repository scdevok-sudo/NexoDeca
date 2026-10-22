/**
 * monthly-report — Genera y guarda el reporte mensual para YPF.
 * Módulo: M9 · Reporte mensual YPF (spec §9, GET /reports/monthly/{year}/{month})
 *
 * POST JSON { year: number, month: number }
 * Respuesta: { id, anio, mes, version, createdAt, downloadUrl } — URL firmada que vence a los 2 minutos.
 * Errores: 400 año/mes inválidos o mes futuro · 401 · 403 · 405.
 *
 * Qué hace:
 *  1. Junta las capacitaciones del mes (tema, fecha, nro de registro, capacitador) y la nómina de participantes.
 *  2. Arma un Excel (exceljs, ver docs/decisiones-tecnicas.md) con tres hojas: Resumen, Capacitaciones y Nómina.
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

import ExcelJS from 'npm:exceljs@4.4.0';
import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, errorToResponse, jsonResponse } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';

const FN = 'monthly-report';
const BUCKET = 'reportes-mensuales';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const URL_TTL_SECONDS = 120;
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface TrainingRow {
  numero_registro: number;
  fecha_dictado: string;
  duracion_real: number;
  estado: 'activa' | 'anulada';
  training_topics: { nombre: string } | null;
  profiles: { nombre: string } | null;
  training_attendees: {
    resultado: 'aprobado' | 'no_aprobado';
    personnel: { dni: string; nombre: string; apellido: string } | null;
    positions: { nombre: string } | null;
  }[];
}

/** AAAA-MM-DD → DD/MM/AAAA. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function hoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

/** Encabezado en negrita, fila fija al hacer scroll y filtro en cada columna. */
function styleHeader(ws: ExcelJS.Worksheet) {
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
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

    // ---------- Armado del Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SGI Deca';
    wb.created = new Date();

    const activas = trainings.filter((t) => t.estado === 'activa');
    const nomina = activas.flatMap((t) =>
      t.training_attendees
        .filter((a) => a.personnel)
        .map((a) => ({ t, a }))
        .sort((x, y) =>
          `${x.a.personnel!.apellido} ${x.a.personnel!.nombre}`.localeCompare(
            `${y.a.personnel!.apellido} ${y.a.personnel!.nombre}`,
            'es',
          ),
        ),
    );

    const resumen = wb.addWorksheet('Resumen');
    resumen.columns = [{ width: 32 }, { width: 50 }];
    resumen.addRow([`Reporte mensual de capacitaciones — ${MESES[mes - 1]} ${anio}`]).font = { bold: true, size: 14 };
    resumen.addRow(['Deca Electromecánica · Nexoris']);
    resumen.addRow([]);
    resumen.addRow(['Generado el', `${formatDate(hoy)} por ${perfil?.nombre ?? caller.email}`]);
    resumen.addRow(['Capacitaciones dictadas (activas)', activas.length]);
    resumen.addRow(['Capacitaciones anuladas', trainings.length - activas.length]);
    resumen.addRow(['Participaciones en la nómina', nomina.length]);
    resumen.addRow(['Aprobados', nomina.filter((n) => n.a.resultado === 'aprobado').length]);
    if (enCurso) {
      resumen.addRow([]);
      resumen.addRow(['ATENCIÓN', 'El mes todavía está en curso: los datos son parciales.']).font = { bold: true };
    }

    const caps = wb.addWorksheet('Capacitaciones');
    caps.columns = [
      { header: 'Nro. registro', width: 14 },
      { header: 'Fecha', width: 12 },
      { header: 'Tema', width: 40 },
      { header: 'Capacitador', width: 28 },
      { header: 'Duración (h)', width: 13 },
      { header: 'Estado', width: 10 },
      { header: 'Participantes', width: 14 },
      { header: 'Aprobados', width: 11 },
    ];
    for (const t of trainings) {
      const anulada = t.estado === 'anulada';
      caps.addRow([
        t.numero_registro,
        formatDate(t.fecha_dictado),
        t.training_topics?.nombre ?? '',
        t.profiles?.nombre ?? '',
        Number(t.duracion_real),
        anulada ? 'Anulada' : 'Activa',
        anulada ? null : t.training_attendees.length,
        anulada ? null : t.training_attendees.filter((a) => a.resultado === 'aprobado').length,
      ]);
    }
    styleHeader(caps);

    const nom = wb.addWorksheet('Nómina');
    nom.columns = [
      { header: 'Nro. registro', width: 14 },
      { header: 'Fecha', width: 12 },
      { header: 'Tema', width: 40 },
      { header: 'Apellido', width: 22 },
      { header: 'Nombre', width: 22 },
      { header: 'DNI', width: 12 },
      { header: 'Puesto (al dictado)', width: 24 },
      { header: 'Resultado', width: 13 },
    ];
    for (const { t, a } of nomina) {
      const p = a.personnel!;
      nom.addRow([
        t.numero_registro,
        formatDate(t.fecha_dictado),
        t.training_topics?.nombre ?? '',
        p.apellido,
        p.nombre,
        p.dni,
        a.positions?.nombre ?? '',
        a.resultado === 'aprobado' ? 'Aprobado' : 'No aprobado',
      ]);
    }
    styleHeader(nom);

    const buffer = new Uint8Array(await wb.xlsx.writeBuffer());

    // ---------- Guardado histórico (nunca se pisa: nombre único + upsert false)
    const path = `${anio}/${String(mes).padStart(2, '0')}/${crypto.randomUUID()}.xlsx`;
    const { error: upError } = await admin.storage.from(BUCKET).upload(path, buffer, { contentType: XLSX, upsert: false });
    if (upError) throw new HttpError(500, 'No se pudo guardar el reporte');
    subido = path;

    const { data: reg, error: regError } = await admin.rpc('register_monthly_report', {
      p_anio: anio,
      p_mes: mes,
      p_storage_path: path,
      p_generado_por: caller.id,
      p_capacitaciones: activas.length,
      p_participantes: nomina.length,
    });
    const registro = (reg as { id: string; version: number }[] | null)?.[0];
    if (regError || !registro) throw new HttpError(500, 'No se pudo registrar el reporte');
    subido = null; // ya quedó registrado: no se borra

    const fileName = `reporte-ypf-${mesPedido}-v${registro.version}.xlsx`;
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, URL_TTL_SECONDS, { download: fileName });
    if (signError || !signed) throw new HttpError(500, 'El reporte se generó, pero no se pudo preparar la descarga');

    log(FN, 'info', 'reporte generado', { anio, mes, version: registro.version, por: caller.id });
    return jsonResponse(200, {
      id: registro.id,
      anio,
      mes,
      version: registro.version,
      createdAt: new Date().toISOString(),
      downloadUrl: signed.signedUrl,
    });
  } catch (err) {
    // Si el archivo se subió pero no quedó registrado, se borra para no dejar huérfanos.
    if (subido) {
      const { error: rmError } = await admin.storage.from(BUCKET).remove([subido]);
      if (rmError) log(FN, 'warn', 'no se pudo borrar un reporte huérfano', { path: subido });
    }
    log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
