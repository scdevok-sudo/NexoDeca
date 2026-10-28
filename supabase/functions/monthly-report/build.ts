/**
 * monthly-report/build.ts — Arma el archivo del reporte (Excel o PDF) a partir de las capacitaciones del mes.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Separado de index.ts para poder testearlo sin Supabase: devuelve los bytes, el content-type y la extensión que
 * corresponden al formato pedido (ver tests/report_format_test.ts).
 *
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): las capacitaciones anuladas aparecen en "Capacitaciones"
 *   marcadas como Anulada, pero sus participantes NO van a la nómina.
 */

import ExcelJS from 'npm:exceljs@4.4.0';
import { logoDecaPng } from '../_shared/logo-base64.ts';
import { buildMonthlyPdf } from './pdf.ts';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PDF_MIME = 'application/pdf';
export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export type ReportFormat = 'xlsx' | 'pdf';

export interface TrainingRow {
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
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Encabezado en negrita, fila fija al hacer scroll y filtro en cada columna. */
function styleHeader(ws: ExcelJS.Worksheet) {
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columnCount },
  };
}

export interface BuildInput {
  formato: ReportFormat;
  anio: number;
  mes: number;
  /** AAAA-MM-DD de hoy en Argentina. */
  hoy: string;
  enCurso: boolean;
  generadoPor: string;
  trainings: TrainingRow[];
  cuit?: string | null;
  domicilio?: string | null;
}

export interface BuiltReport {
  bytes: Uint8Array;
  contentType: string;
  extension: ReportFormat;
  capacitaciones: number;
  participantes: number;
}

export async function buildReportFile(input: BuildInput): Promise<BuiltReport> {
  const { formato, anio, mes, hoy, enCurso, trainings } = input;
  const perfil = { nombre: input.generadoPor };
  // ---------- Datos comunes a los dos formatos
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

  let buffer: Uint8Array;
  if (formato === 'pdf') {
    buffer = await buildMonthlyPdf({
      titulo: `Reporte mensual — ${MESES[mes - 1]} ${anio}`,
      generadoEl: formatDate(hoy),
      generadoPor: perfil.nombre,
      enCurso,
      logo: logoDecaPng(),
      cuit: input.cuit ?? null,
      domicilio: input.domicilio ?? null,
      capacitaciones: trainings.map((t) => ({
        nro: t.numero_registro,
        fecha: formatDate(t.fecha_dictado),
        tema: t.training_topics?.nombre ?? '',
        capacitador: t.profiles?.nombre ?? '',
        duracion: Number(t.duracion_real),
        anulada: t.estado === 'anulada',
        participantes: t.training_attendees.length,
        aprobados: t.training_attendees.filter((a) => a.resultado === 'aprobado').length,
      })),
      nomina: nomina.map(({ t, a }) => ({
        nro: t.numero_registro,
        fecha: formatDate(t.fecha_dictado),
        tema: t.training_topics?.nombre ?? '',
        persona: `${a.personnel!.apellido}, ${a.personnel!.nombre}`,
        dni: a.personnel!.dni,
        puesto: a.positions?.nombre ?? '',
        aprobado: a.resultado === 'aprobado',
      })),
      resumen: {
        activas: activas.length,
        anuladas: trainings.length - activas.length,
        participaciones: nomina.length,
        aprobados: nomina.filter((n) => n.a.resultado === 'aprobado').length,
      },
    });
  } else {
    // ---------- Armado del Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SGI Deca';
    wb.created = new Date();

    const resumen = wb.addWorksheet('Resumen');
    resumen.columns = [{ width: 32 }, { width: 50 }];
    resumen.addRow([`Reporte mensual de capacitaciones — ${MESES[mes - 1]} ${anio}`]).font = { bold: true, size: 14 };
    resumen.addRow(['Deca Electromecánica · Nexoris']);
    resumen.addRow([]);
    resumen.addRow(['Generado el', `${formatDate(hoy)} por ${perfil.nombre}`]);
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

    buffer = new Uint8Array(await wb.xlsx.writeBuffer());
  }

  return {
    bytes: buffer,
    contentType: formato === 'pdf' ? PDF_MIME : XLSX_MIME,
    extension: formato,
    capacitaciones: activas.length,
    participantes: nomina.length,
  };
}
