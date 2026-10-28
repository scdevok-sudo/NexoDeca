/**
 * tests/report_format_test.ts — El reporte mensual sale en el formato que se pidió (M9).
 * Correr: npx deno test --node-modules-dir=none --allow-env --allow-read supabase/functions/tests/report_format_test.ts
 *
 * Antecedente: en producción "Descargar PDF" bajaba un Excel porque seguía desplegada la versión vieja de
 * monthly-report (siempre xlsx). Estos tests verifican el CONTENIDO real del archivo (content-type + primeros bytes),
 * no solo que la función no tire error. Sin red ni Supabase.
 */

import { assert, assertEquals } from 'jsr:@std/assert@1';
import { buildReportFile, PDF_MIME, XLSX_MIME, type BuildInput, type ReportFormat } from '../monthly-report/build.ts';

const trainings: BuildInput['trainings'] = [
  {
    numero_registro: 101,
    fecha_dictado: '2026-10-05',
    duracion_real: 1.5,
    estado: 'activa',
    training_topics: { nombre: 'Trabajo en altura' },
    profiles: { nombre: 'Juan Pérez' },
    training_attendees: [
      {
        resultado: 'aprobado',
        personnel: { dni: '30123456', nombre: 'María Belén', apellido: 'González' },
        positions: { nombre: 'Operario' },
      },
      {
        resultado: 'no_aprobado',
        personnel: { dni: '28111222', nombre: 'Luis', apellido: 'Ñandú' },
        positions: { nombre: 'Chofer' },
      },
    ],
  },
  {
    numero_registro: 102,
    fecha_dictado: '2026-10-07',
    duracion_real: 1,
    estado: 'anulada',
    training_topics: { nombre: 'Primeros auxilios' },
    profiles: { nombre: 'Juan Pérez' },
    training_attendees: [
      {
        resultado: 'aprobado',
        personnel: { dni: '99999999', nombre: 'Anulado', apellido: 'Persona' },
        positions: null,
      },
    ],
  },
];

function build(formato: ReportFormat) {
  return buildReportFile({
    formato,
    anio: 2026,
    mes: 10,
    hoy: '2026-10-27',
    enCurso: true,
    generadoPor: 'Santi',
    trainings,
    cuit: '30-12345678-9',
    domicilio: 'Av. Siempreviva 742',
  });
}

const ascii = (b: Uint8Array, n: number) => new TextDecoder('latin1').decode(b.slice(0, n));

Deno.test("formato 'pdf' devuelve un PDF: content-type, extensión y firma %PDF-", async () => {
  const r = await build('pdf');
  assertEquals(r.contentType, PDF_MIME);
  assertEquals(r.extension, 'pdf');
  assertEquals(ascii(r.bytes, 5), '%PDF-');
  assert(ascii(r.bytes.slice(-16), 16).includes('%%EOF'), 'el PDF no termina con %%EOF');
  assert(r.bytes.length > 1000);
});

Deno.test("formato 'xlsx' devuelve un Excel: content-type, extensión y firma ZIP (PK)", async () => {
  const r = await build('xlsx');
  assertEquals(r.contentType, XLSX_MIME);
  assertEquals(r.extension, 'xlsx');
  assertEquals(ascii(r.bytes, 2), 'PK');
  assertEquals([...r.bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
});

Deno.test('los dos formatos cuentan igual: anuladas fuera de la nómina', async () => {
  for (const f of ['pdf', 'xlsx'] as const) {
    const r = await build(f);
    assertEquals(r.capacitaciones, 1, `${f}: capacitaciones activas`);
    assertEquals(r.participantes, 2, `${f}: la nómina no incluye a los de la anulada`);
  }
});

Deno.test('el PDF y el Excel no son el mismo archivo', async () => {
  const [pdf, xlsx] = await Promise.all([build('pdf'), build('xlsx')]);
  assert(ascii(pdf.bytes, 2) !== ascii(xlsx.bytes, 2));
});
