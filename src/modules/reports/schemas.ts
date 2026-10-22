/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor (monthly-report) repite todo.
 */

import { z } from 'zod';

/** Mes actual en formato AAAA-MM (hora local). */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// REGLA DE NEGOCIO (spec §9): se puede generar el mes en curso (incompleto) o uno anterior; un mes futuro, no.
export const monthYearSchema = z
  .object({
    year: z.number('Elegí el año').int().min(2020, 'Desde 2020').max(2100, 'Hasta 2100'),
    month: z.number('Elegí el mes').int().min(1, 'Mes inválido').max(12, 'Mes inválido'),
  })
  .refine(
    (v) => `${v.year}-${String(v.month).padStart(2, '0')}` <= currentMonthKey(),
    'No se puede generar el reporte de un mes futuro',
  );

export type MonthYearValues = z.infer<typeof monthYearSchema>;
