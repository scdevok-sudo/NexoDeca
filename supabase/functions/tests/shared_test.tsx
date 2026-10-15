/**
 * tests/shared_test.ts — Tests unitarios de los helpers de las Edge Functions (M1/M2).
 * Correr: deno test --allow-env supabase/functions/tests/
 * Sin red ni Supabase: prueban validación, CSV, límites de tamaño y el rechazo 401 sin token.
 */

import { requireUser } from '../_shared/auth.ts';
import { readBodyLimited, readFormDataLimited, readJsonLimited } from '../_shared/body.ts';
import { decode, detectSeparator, normalizeHeader, parseCsv } from '../_shared/csv.ts';
import { HttpError } from '../_shared/errors.ts';
import { normalizeDate, normalizeDni, normalizeEmail, normalizeName } from '../_shared/validation.ts';

// Asserts mínimos sin dependencias (el runtime de Edge Functions no trae @std/assert instalado).
function strictEqual(actual: unknown, expected: unknown, msg?: string) {
  if (actual !== expected) throw new Error(`${msg ?? ''} esperado ${JSON.stringify(expected)}, vino ${JSON.stringify(actual)}`);
}
function deepStrictEqual(actual: unknown, expected: unknown) {
  strictEqual(JSON.stringify(actual), JSON.stringify(expected));
}
async function rejects(p: Promise<unknown>, check: (err: unknown) => boolean) {
  try {
    await p;
  } catch (err) {
    if (!check(err)) throw new Error('Error inesperado: ' + String(err));
    return;
  }
  throw new Error('Se esperaba que falle');
}

const status = (code: number) => (err: unknown) => err instanceof HttpError && err.status === code;

Deno.test('DNI: normaliza puntos/espacios y exige 7 u 8 dígitos', () => {
  strictEqual(normalizeDni(' 30.123.456 '), '30123456');
  strictEqual(normalizeDni('1234567'), '1234567');
  strictEqual(normalizeDni('123'), null);
  strictEqual(normalizeDni('123456789'), null);
  strictEqual(normalizeDni("30123456' OR 1=1"), null);
});

Deno.test('Nombres: bloquea inyección de fórmulas y caracteres raros', () => {
  strictEqual(normalizeName("O'Brien-López"), "O'Brien-López");
  strictEqual(normalizeName('  Ana   María '), 'Ana María');
  for (const bad of ['=HYPERLINK("x")', '+1', '-1', '@SUM(A1)', '<script>', '', 'a'.repeat(81)]) {
    strictEqual(normalizeName(bad), null, bad);
  }
});

Deno.test('Fechas: AAAA-MM-DD y DD/MM/AAAA, rechaza inexistentes', () => {
  strictEqual(normalizeDate('2020-02-29'), '2020-02-29');
  strictEqual(normalizeDate('1/2/2020'), '2020-02-01');
  strictEqual(normalizeDate('2021-02-29'), null);
  strictEqual(normalizeDate('31/04/2021'), null);
  strictEqual(normalizeDate('2021-13-01'), null);
});

Deno.test('Email: normaliza y valida', () => {
  strictEqual(normalizeEmail(' A@B.com '), 'a@b.com');
  strictEqual(normalizeEmail('sin-arroba'), null);
  strictEqual(normalizeEmail(123), null);
});

Deno.test('CSV: comillas, ; , BOM, CRLF, líneas vacías y número de línea', () => {
  const text = decode(
    new TextEncoder().encode('\uFEFFDNI;Nombre;Apellido;Puesto;Fecha de ingreso\r\n1;"a;b";"c ""d""";x;y\r\n\r\n2;e;f;g;h\n'),
  );
  strictEqual(detectSeparator(text), ';');
  const rows = parseCsv(text, ';');
  deepStrictEqual(rows[0].cells.map(normalizeHeader), ['dni', 'nombre', 'apellido', 'puesto', 'fecha_de_ingreso']);
  deepStrictEqual(rows[1], { line: 2, cells: ['1', 'a;b', 'c "d"', 'x', 'y'] });
  strictEqual(rows[2].line, 4);
  strictEqual(rows.length, 3);
});

Deno.test('CSV: comillas sin cerrar → 400', () => {
  try {
    parseCsv('a,"b\n', ',');
    throw new Error('debió fallar');
  } catch (err) {
    strictEqual(status(400)(err), true);
  }
});

Deno.test('CSV: Windows-1252 se decodifica', () => {
  strictEqual(decode(new Uint8Array([0x47, 0xf3, 0x6d, 0x65, 0x7a])), 'Gómez');
});

Deno.test('Body: corta el stream al pasar el tope aunque no haya Content-Length → 413', async () => {
  const big = new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < 20; i++) c.enqueue(new Uint8Array(1024));
      c.close();
    },
  });
  const req = new Request('http://x', { method: 'POST', body: big });
  await rejects(readBodyLimited(req, 10 * 1024), status(413));
});

Deno.test('Body: Content-Length declarado mayor al tope → 413 sin leer', async () => {
  const req = new Request('http://x', { method: 'POST', body: 'x', headers: { 'content-length': '999999' } });
  await rejects(readBodyLimited(req, 1024), status(413));
});

Deno.test('JSON: content-type incorrecto, JSON roto o array → 400', async () => {
  const mk = (body: string, ct = 'application/json') =>
    new Request('http://x', { method: 'POST', body, headers: { 'content-type': ct } });
  await rejects(readJsonLimited(mk('{}', 'text/plain'), 1024), status(400));
  await rejects(readJsonLimited(mk('{oops'), 1024), status(400));
  await rejects(readJsonLimited(mk('[1]'), 1024), status(400));
  deepStrictEqual(await readJsonLimited(mk('{"a":1}'), 1024), { a: 1 });
});

Deno.test('FormData: sin multipart → 400', async () => {
  const req = new Request('http://x', { method: 'POST', body: 'x', headers: { 'content-type': 'text/csv' } });
  await rejects(readFormDataLimited(req, 1024), status(400));
});

Deno.test('Auth: sin header o header mal formado → 401 antes de tocar Supabase', async () => {
  await rejects(requireUser(new Request('http://x')), status(401));
  await rejects(requireUser(new Request('http://x', { headers: { Authorization: 'Basic abc' } })), status(401));
  await rejects(requireUser(new Request('http://x', { headers: { Authorization: 'Bearer' } })), status(401));
});
