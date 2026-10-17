/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID } from '../../types/common';

export type PlanMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Tema tal como se muestra en el plan (puede haberse desactivado después de planificarlo). */
export interface PlanTopic {
  id: UUID;
  nombre: string;
  activo: boolean;
}

export interface PlanMonthEntry {
  mes: PlanMonth;
  topics: PlanTopic[];
}

export interface TrainingPlan {
  year: number;
  /** Siempre los 12 meses, en orden (un mes sin temas viene con `topics: []`). */
  meses: PlanMonthEntry[];
}

/** Lo que se manda al guardar: por cada mes, los ids de sus temas. */
export interface PlanInput {
  meses: { mes: PlanMonth; topicIds: UUID[] }[];
}

export interface CopyPlanResult {
  plan: TrainingPlan;
  /** Temas del año de origen que no se copiaron porque hoy están inactivos. */
  temasOmitidos: string[];
}

/** Persona que debería tomar un tema planificado (según su puesto actual). */
export interface ExpectedAttendee {
  id: UUID;
  dni: string;
  nombre: string;
  apellido: string;
  puestoNombre: string | null;
}
