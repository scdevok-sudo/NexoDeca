/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

/** Los inputs del form llegan como texto: '' → null, el resto → número (NaN si no es numérico, y falla). */
const toNumberOrNull = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

export const topicSchema = z.object({
  // REGLA DE NEGOCIO: nombre único (lo garantiza el índice training_topics_nombre_lower_key → 409).
  nombre: z.string().trim().min(1, 'Ingresá el nombre del tema').max(150, 'Máximo 150 caracteres'),
  tipo: z.enum(['obligatorio', 'electivo'], 'Elegí el tipo'),
  // REGLA DE NEGOCIO: spec §4 "puestos a los que aplica (uno o varios)" → al menos uno.
  puestoIds: z.array(z.uuid()).min(1, 'Elegí al menos un puesto'),
  // Vacío (null) = el tema no vence (ej. inducción única).
  periodicidadMeses: z.preprocess(
    toNumberOrNull,
    z.number('Tiene que ser un número').int('Tiene que ser un número entero').positive('Tiene que ser mayor a 0').nullable(),
  ),
  // numeric(5,2) en la base: hasta 999,99 h (la base redondea a 2 decimales).
  duracionHoras: z.preprocess(
    toNumberOrNull,
    z.number('Ingresá la duración en horas').positive('Tiene que ser mayor a 0').max(999.99, 'Máximo 999,99 horas'),
  ),
  activo: z.boolean(),
});

/** Filtros de GET /training-topics. Un valor inválido es un 400, no se ignora en silencio. */
// TODO(consultar a Santi): la spec no dice si el listado filtra por activo/inactivo (Personal tiene `estado`).
export const topicFiltersSchema = z.object({
  q: z.string().max(100, 'Máximo 100 caracteres').optional(),
  tipo: z.enum(['obligatorio', 'electivo'], 'Tipo inválido').optional(),
  puestoId: z.uuid('Puesto inválido').optional(),
  page: z.number().int().min(1),
});

export type TopicFormValues = z.infer<typeof topicSchema>;
