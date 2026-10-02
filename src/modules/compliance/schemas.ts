/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

export const complianceFiltersSchema = z.object({
  puestoId: z.string().optional(),
  topicId: z.string().optional(),
  // REGLA DE NEGOCIO: default 15 días.
  dias: z.number().int().positive().default(15),
});

export type ComplianceFiltersValues = z.infer<typeof complianceFiltersSchema>;
