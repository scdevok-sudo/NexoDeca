/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo
 *    (triggers y RPC de 0019).
 */

import { z } from 'zod';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha de hoy en la hora local, en formato AAAA-MM-DD (comparable como texto). */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const toNumberOrNull = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

export const trainingSchema = z.object({
  // 400 si falta el tema o la fecha es inválida (spec §API).
  topicId: z.uuid('Elegí el tema'),
  // REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): se registran cursos ya dictados → no se aceptan fechas futuras.
  fecha: z
    .string()
    .regex(ISO_DATE, 'Ingresá la fecha de dictado')
    .refine((f) => f <= todayISO(), 'La fecha de dictado no puede ser futura'),
  // numeric(5,2) en la base: hasta 999,99 h.
  duracionHoras: z.preprocess(
    toNumberOrNull,
    z.number('Ingresá la duración real en horas').positive('Tiene que ser mayor a 0').max(999.99, 'Máximo 999,99 horas'),
  ),
  // Spec: "temario desarrollado (texto libre breve)".
  temario: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  asistentes: z
    .array(
      z.object({
        personId: z.uuid('Persona inválida'),
        resultado: z.enum(['aprobado', 'no_aprobado'], 'Elegí el resultado'),
      }),
    )
    // REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): al menos un asistente.
    .min(1, 'Cargá al menos un asistente')
    .refine((a) => new Set(a.map((x) => x.personId)).size === a.length, 'Hay personas repetidas'),
  // REGLA DE NEGOCIO: el nro de registro NO viene del cliente, lo asigna el servidor.
  // REGLA DE NEGOCIO: el puesto y la aplicabilidad tampoco: los calcula el servidor.
});

export type TrainingFormValues = z.infer<typeof trainingSchema>;

/** Filtros de GET /trainings. Un valor inválido es un 400, no se ignora en silencio. */
export const trainingFiltersSchema = z
  .object({
    topicId: z.uuid('Tema inválido').optional(),
    fechaDesde: z.string().regex(ISO_DATE, 'Fecha inválida').optional(),
    fechaHasta: z.string().regex(ISO_DATE, 'Fecha inválida').optional(),
    capacitadorId: z.uuid('Capacitador inválido').optional(),
    estado: z.enum(['activa', 'anulada'], 'Estado inválido').optional(),
    page: z.number().int().min(1),
  })
  .refine((f) => !f.fechaDesde || !f.fechaHasta || f.fechaDesde <= f.fechaHasta, 'La fecha "desde" es posterior a "hasta"');
