/**
 * lib/forms.ts — Puente entre zod y react-hook-form (no hay @hookform/resolvers instalado).
 */

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Valida `values` con el schema. Si falla, carga los errores en el form y devuelve null.
 * Si pasa, devuelve los datos ya transformados por zod.
 */
export function parseForm<TForm extends FieldValues, TOut>(
  schema: ZodType<TOut>,
  values: TForm,
  setError: UseFormSetError<TForm>,
): TOut | null {
  const result = schema.safeParse(values);
  if (result.success) return result.data;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') setError(field as Path<TForm>, { message: issue.message });
  }
  return null;
}

/** REGLA DE NEGOCIO: un redirect post-login solo puede ir a una ruta interna (evita open redirect). */
export function safeInternalPath(path: unknown, fallback = '/'): string {
  if (typeof path !== 'string') return fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  return path;
}
