/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo
 *    (compliance_upcoming, 0021).
 */

import { z } from 'zod';

/** Spec §8: "próximas a vencer (ej. dentro de los próximos 15 días)". */
export const DEFAULT_DIAS = 15;

/** Filtros de GET /compliance/upcoming. Un valor inválido es un 400, no se ignora en silencio. */
export const complianceFiltersSchema = z.object({
  puestoId: z.uuid('Puesto inválido').optional(),
  topicId: z.uuid('Tema inválido').optional(),
  dias: z
    .number('Ingresá la cantidad de días')
    .int('Tiene que ser un número entero')
    .min(0, 'Mínimo 0 días')
    .max(365, 'Máximo 365 días')
    .optional(),
});
