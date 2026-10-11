/**
 * _shared/body.ts — Lectura del cuerpo con tope de tamaño.
 * Módulo: compartido (creado desde M1/M2).
 *
 * No confía en Content-Length (puede faltar con transfer-encoding: chunked): corta el stream al pasar el tope.
 */

import { HttpError, badRequest } from './errors.ts';

export async function readBodyLimited(req: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > maxBytes) throw new HttpError(413, 'El cuerpo de la solicitud es demasiado grande');
  if (!req.body) return new Uint8Array();

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, 'El cuerpo de la solicitud es demasiado grande');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** JSON con tope de tamaño. Exige Content-Type application/json y un objeto en la raíz. */
export async function readJsonLimited(req: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (!(req.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    throw badRequest('Se esperaba JSON');
  }
  const bytes = await readBodyLimited(req, maxBytes);
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw badRequest('JSON inválido');
  }
}

/** multipart/form-data con tope de tamaño. */
export async function readFormDataLimited(req: Request, maxBytes: number): Promise<FormData> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    throw badRequest('Se esperaba multipart/form-data con el campo "file"');
  }
  const bytes = await readBodyLimited(req, maxBytes);
  try {
    return await new Response(bytes, { headers: { 'content-type': contentType } }).formData();
  } catch {
    throw badRequest('Formulario inválido');
  }
}
