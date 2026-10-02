/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID } from '../../types/common';

export type PlanMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface PlanMonthEntry {
  mes: PlanMonth;
  topicIds: UUID[];
}

export interface TrainingPlan {
  year: number;
  meses: PlanMonthEntry[];
}

/** Personas que deberían tomar un tema planificado (según su puesto). */
export interface ExpectedAttendees {
  mes: PlanMonth;
  topicId: UUID;
  personIds: UUID[];
}
