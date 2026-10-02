/**
 * _shared/errors.ts — Respuestas de error HTTP uniformes (400/401/403/404/409).
 * Módulo: Setup (helper compartido de Edge Functions).
 *
 * Spec §API: todos los endpoints manejan errores con el código HTTP correspondiente
 * y el detalle en el cuerpo de la respuesta.
 */

import { corsHeaders } from './cors.ts';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonError(status: number, message: string, details?: unknown): Response {
  return jsonResponse(status, { status, message, details });
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details);
export const unauthorized = (message = 'No autenticado') => new HttpError(401, message);
export const forbidden = (message = 'No tenés permiso para esta acción') => new HttpError(403, message);
export const notFound = (message = 'No encontrado') => new HttpError(404, message);
export const conflict = (message: string, details?: unknown) => new HttpError(409, message, details);

/** Convierte cualquier excepción en una Response. Lo no previsto sale como 500 sin filtrar detalles internos. */
export function errorToResponse(err: unknown): Response {
  if (err instanceof HttpError) return jsonError(err.status, err.message, err.details);
  return jsonError(500, 'Error interno');
}
