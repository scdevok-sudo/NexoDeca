/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

/** Mismo rango que el CHECK de training_plans.anio (0013). */
export const PLAN_YEAR_MIN = 2020;
export const PLAN_YEAR_MAX = 2100;

export const planYearSchema = z
  .number('Año inválido')
  .int('Año inválido')
  .min(PLAN_YEAR_MIN, `El año tiene que ser desde ${PLAN_YEAR_MIN}`)
  .max(PLAN_YEAR_MAX, `El año tiene que ser hasta ${PLAN_YEAR_MAX}`);

export const planSchema = z.object({
  meses: z
    .array(
      z.object({
        mes: z.number().int().min(1).max(12),
        // REGLA DE NEGOCIO: solo temas existentes y activos (en la base: FK + trigger de 0018 → 400).
        topicIds: z.array(z.uuid('Tema inválido')),
      }),
    )
    .refine((meses) => new Set(meses.map((m) => m.mes)).size === meses.length, 'Hay meses repetidos'),
});

export type PlanFormValues = z.infer<typeof planSchema>;
