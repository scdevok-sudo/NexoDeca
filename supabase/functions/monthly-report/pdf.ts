/**
 * monthly-report/pdf.ts — Arma el reporte mensual en PDF (pdf-lib, mismo patrón que generate-certificates).
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * A4 apaisado: encabezado con logo + CUIT + domicilio, título, resumen, tabla de capacitaciones y tabla de nómina.
 * Las tablas cortan de página repitiendo el encabezado de columnas; los textos largos se truncan con "…".
 * REGLA DE NEGOCIO: las anuladas aparecen en "Capacitaciones" marcadas "Anulada"; sus participantes NO van a la nómina
 *   (quien llama ya las filtra de `nomina`).
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'npm:pdf-lib@1.17.1';
import { winAnsiSafe } from '../_shared/pdf.ts';

export interface PdfTrainingRow {
  nro: number;
  fecha: string;
  tema: string;
  capacitador: string;
  duracion: number;
  anulada: boolean;
  participantes: number;
  aprobados: number;
}

export interface PdfNominaRow {
  nro: number;
  fecha: string;
  tema: string;
  persona: string;
  dni: string;
  puesto: string;
  aprobado: boolean;
}

export interface MonthlyPdfData {
  titulo: string;
  generadoEl: string;
  generadoPor: string;
  enCurso: boolean;
  logo: Uint8Array | null;
  cuit: string | null;
  domicilio: string | null;
  capacitaciones: PdfTrainingRow[];
  nomina: PdfNominaRow[];
  resumen: {
    activas: number;
    anuladas: number;
    participaciones: number;
    aprobados: number;
  };
}

interface Col {
  header: string;
  width: number;
  align?: 'left' | 'right';
}

const PAGE_W = 842;
const PAGE_H = 595;
const MARGIN = 40;
const AZUL = rgb(0.027, 0.031, 0.396); // azul del logo de Deca (#070865)
const GRIS = rgb(0.4, 0.4, 0.4);
const TEXTO = rgb(0.1, 0.1, 0.1);
const ROW_H = 17;
const BOTTOM = 50; // reserva para el pie

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = winAnsiSafe(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let s = safe;
  while (s.length > 0 && font.widthOfTextAtSize(s + '...', size) > maxWidth) s = s.slice(0, -1);
  return s.trimEnd() + '...';
}

export async function buildMonthlyPdf(d: MonthlyPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(d.titulo);
  doc.setCreator('SGI Deca');
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo: PDFImage | null = null;
  if (d.logo) {
    try {
      logo = await doc.embedPng(d.logo);
    } catch {
      logo = null; // sin logo se usa el encabezado de texto
    }
  }

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ---------- Encabezado: logo + datos de la empresa (mismo patrón que el certificado)
  const headTop = y;
  let textX = MARGIN;
  if (logo) {
    const h = 38;
    const w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: MARGIN, y: headTop - h, width: w, height: h });
    textX = MARGIN + w + 16;
  } else {
    const nombre = 'DECA ELECTROMECÁNICA S.A.';
    page.drawText(nombre, {
      x: MARGIN,
      y: headTop - 24,
      size: 15,
      font: bold,
      color: AZUL,
    });
    textX = MARGIN + bold.widthOfTextAtSize(nombre, 15) + 16;
  }
  const datos = [d.cuit ? `CUIT ${d.cuit}` : null, d.domicilio].filter((t): t is string => Boolean(t));
  datos.forEach((t, i) =>
    page.drawText(winAnsiSafe(t), {
      x: textX,
      y: headTop - 16 - i * 13,
      size: 9,
      font: regular,
      color: GRIS,
    }),
  );
  const rotulo = 'REPORTE MENSUAL';
  page.drawText(rotulo, {
    x: PAGE_W - MARGIN - bold.widthOfTextAtSize(rotulo, 9),
    y: headTop - 14,
    size: 9,
    font: bold,
    color: GRIS,
  });
  y = headTop - 38 - 12;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1.5,
    color: AZUL,
  });
  y -= 28;

  // ---------- Título y resumen
  page.drawText(winAnsiSafe(d.titulo), {
    x: MARGIN,
    y,
    size: 18,
    font: bold,
    color: AZUL,
  });
  y -= 18;
  page.drawText(winAnsiSafe(`Generado el ${d.generadoEl} por ${d.generadoPor}`), {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: GRIS,
  });
  y -= 22;

  const r = d.resumen;
  const kpis: [string, number][] = [
    ['Capacitaciones dictadas', r.activas],
    ['Anuladas', r.anuladas],
    ['Participaciones', r.participaciones],
    ['Aprobados', r.aprobados],
  ];
  const kpiW = (PAGE_W - MARGIN * 2 - 3 * 12) / 4;
  kpis.forEach(([label, value], i) => {
    const x = MARGIN + i * (kpiW + 12);
    page.drawRectangle({
      x,
      y: y - 40,
      width: kpiW,
      height: 44,
      borderColor: rgb(0.85, 0.85, 0.88),
      borderWidth: 1,
      color: rgb(0.97, 0.97, 0.98),
    });
    page.drawText(String(value), {
      x: x + 10,
      y: y - 20,
      size: 18,
      font: bold,
      color: AZUL,
    });
    page.drawText(label, {
      x: x + 10,
      y: y - 34,
      size: 8,
      font: regular,
      color: GRIS,
    });
  });
  y -= 56;
  if (d.enCurso) {
    page.drawText('ATENCIÓN: el mes todavía está en curso, los datos son parciales.', {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
      color: rgb(0.7, 0.35, 0),
    });
    y -= 16;
  }
  y -= 8;

  // ---------- Tablas
  const nuevaPagina = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  const tabla = <T>(
    titulo: string,
    cols: Col[],
    rows: T[],
    cell: (row: T) => string[],
    vacio: string,
    anulada?: (row: T) => boolean,
  ) => {
    const headerRow = () => {
      page.drawRectangle({
        x: MARGIN,
        y: y - ROW_H + 4,
        width: PAGE_W - MARGIN * 2,
        height: ROW_H,
        color: AZUL,
      });
      let x = MARGIN + 6;
      for (const c of cols) {
        const t = winAnsiSafe(c.header);
        const w = bold.widthOfTextAtSize(t, 8);
        page.drawText(t, {
          x: c.align === 'right' ? x + c.width - 12 - w : x,
          y: y - ROW_H + 9,
          size: 8,
          font: bold,
          color: rgb(1, 1, 1),
        });
        x += c.width;
      }
      y -= ROW_H;
    };

    if (y - 60 < BOTTOM) nuevaPagina();
    page.drawText(winAnsiSafe(titulo), {
      x: MARGIN,
      y,
      size: 12,
      font: bold,
      color: TEXTO,
    });
    y -= 16;
    if (rows.length === 0) {
      page.drawText(winAnsiSafe(vacio), {
        x: MARGIN,
        y,
        size: 9,
        font: regular,
        color: GRIS,
      });
      y -= 24;
      return;
    }
    headerRow();
    rows.forEach((row, i) => {
      if (y - ROW_H < BOTTOM) {
        nuevaPagina();
        headerRow();
      }
      const baja = anulada?.(row) ?? false;
      if (i % 2 === 1) {
        page.drawRectangle({
          x: MARGIN,
          y: y - ROW_H + 4,
          width: PAGE_W - MARGIN * 2,
          height: ROW_H,
          color: rgb(0.96, 0.96, 0.97),
        });
      }
      let x = MARGIN + 6;
      const values = cell(row);
      cols.forEach((c, ci) => {
        const t = truncate(values[ci] ?? '', regular, 8.5, c.width - 12);
        const w = regular.widthOfTextAtSize(t, 8.5);
        page.drawText(t, {
          x: c.align === 'right' ? x + c.width - 12 - w : x,
          y: y - ROW_H + 9,
          size: 8.5,
          font: regular,
          color: baja ? GRIS : TEXTO,
        });
        x += c.width;
      });
      y -= ROW_H;
    });
    y -= 22;
  };

  tabla(
    'Capacitaciones del mes',
    [
      { header: 'Nro. reg.', width: 58 },
      { header: 'Fecha', width: 66 },
      { header: 'Tema', width: 240 },
      { header: 'Capacitador', width: 150 },
      { header: 'Dur. (h)', width: 56, align: 'right' },
      { header: 'Estado', width: 58 },
      { header: 'Particip.', width: 56, align: 'right' },
      { header: 'Aprob.', width: 56, align: 'right' },
    ],
    d.capacitaciones,
    (t) => [
      String(t.nro),
      t.fecha,
      t.tema,
      t.capacitador,
      String(t.duracion).replace('.', ','),
      t.anulada ? 'Anulada' : 'Activa',
      t.anulada ? '-' : String(t.participantes),
      t.anulada ? '-' : String(t.aprobados),
    ],
    'No hubo capacitaciones en el mes.',
    (t) => t.anulada,
  );

  tabla(
    'Nómina de participantes y resultados',
    [
      { header: 'Nro. reg.', width: 58 },
      { header: 'Fecha', width: 66 },
      { header: 'Tema', width: 170 },
      { header: 'Apellido y nombre', width: 180 },
      { header: 'DNI', width: 70 },
      { header: 'Puesto (al dictado)', width: 120 },
      { header: 'Resultado', width: 78 },
    ],
    d.nomina,
    (n) => [String(n.nro), n.fecha, n.tema, n.persona, n.dni, n.puesto, n.aprobado ? 'Aprobado' : 'No aprobado'],
    'No hay participantes en la nómina.',
  );

  // ---------- Pie con numeración
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const t = winAnsiSafe(`${d.titulo} · Página ${i + 1} de ${pages.length}`);
    p.drawText(t, {
      x: (PAGE_W - regular.widthOfTextAtSize(t, 7.5)) / 2,
      y: 24,
      size: 7.5,
      font: regular,
      color: GRIS,
    });
  });

  return await doc.save();
}
