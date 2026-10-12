/**
 * lib/apiError.ts — Error uniforme del frontend (mismos códigos HTTP que documenta la spec).
 * Módulo: compartido (lo crea M1/M2; lo pueden usar todos los módulos).
 *
 * Traduce los errores de PostgREST y de las Edge Functions a { status, message } sin filtrar
 * detalles internos de la base al usuario.
 */

import { FunctionsHttpError } from '@supabase/supabase-js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface PgLikeError {
  code?: string;
  message: string;
}

/**
 * Mapea un error de PostgREST a ApiError.
 * 23505 unique → 409 · 23503 FK → 400 · 23514 check → 400 · 42501 RLS → 403 · PGRST116 sin filas → 404.
 * `overrides` permite un mensaje propio por código (ej. '23505' → 'Ya existe una persona con ese DNI').
 */
export function fromPostgrestError(err: PgLikeError, overrides: Partial<Record<string, string>> = {}): ApiError {
  const code = err.code ?? '';
  const custom = overrides[code];
  switch (code) {
    case '23505':
      return new ApiError(409, custom ?? 'El registro ya existe');
    case '23503':
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
      return new ApiError(400, custom ?? 'Datos inválidos');
    case '42501':
      return new ApiError(403, custom ?? 'No tenés permiso para esta acción');
    case 'PGRST116':
      return new ApiError(404, custom ?? 'No encontrado');
    case 'P0001':
      // Errores levantados a propósito por triggers (RAISE EXCEPTION): el mensaje es para el usuario.
      return new ApiError(400, custom ?? err.message);
    default:
      // No exponer el mensaje crudo de la base.
      return new ApiError(500, 'Error inesperado. Probá de nuevo.');
  }
}

/** Lee el cuerpo { status, message, details } que devuelven nuestras Edge Functions (_shared/errors.ts). */
export async function fromFunctionsError(error: unknown): Promise<ApiError> {
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    try {
      const body = (await res.json()) as { message?: unknown; details?: unknown };
      const message = typeof body.message === 'string' ? body.message : 'Error inesperado';
      return new ApiError(res.status, message, body.details);
    } catch {
      return new ApiError(res.status, 'Error inesperado');
    }
  }
  return new ApiError(503, 'No se pudo conectar con el servidor');
}

/** Mensaje mostrable para cualquier error. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Error inesperado. Probá de nuevo.';
}
