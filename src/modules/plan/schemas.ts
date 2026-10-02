/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

export const planSchema = z.object({
  year: z.number().int().min(2000),
  meses: z.array(
    z.object({
      mes: z.number().int().min(1).max(12),
      // REGLA DE NEGOCIO: solo temas existentes y activos (el servidor responde 400 si no).
      topicIds: z.array(z.string()),
    }),
  ),
});

export type PlanFormValues = z.infer<typeof planSchema>;
