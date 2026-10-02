/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

export const trainingSchema = z.object({
  // 400 si falta el tema o la fecha es inválida (spec §API).
  topicId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duracionHoras: z.number().positive(),
  temario: z.string(),
  asistentes: z.array(
    z.object({
      personId: z.string().min(1),
      resultado: z.enum(['aprobado', 'no_aprobado']),
    }),
  ),
  // REGLA DE NEGOCIO: el nro de registro NO viene del cliente, lo asigna el servidor.
  // REGLA DE NEGOCIO: el puesto y la aplicabilidad tampoco: los calcula el servidor.
});

export type TrainingFormValues = z.infer<typeof trainingSchema>;
