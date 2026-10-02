/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

export const monthYearSchema = z.object({
  year: z.number().int().min(2000),
  month: z.number().int().min(1).max(12),
});

export type MonthYearValues = z.infer<typeof monthYearSchema>;
