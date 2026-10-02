/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { PlanMonth, PlanMonthEntry, TrainingPlan, ExpectedAttendees } from './types';

/**
 * GET /training-plans/{year}
 * PERMISOS: Gerente, Capacitador
 * TODO(consultar a Santi): el cálculo de "quién debería tomarlo" no tiene endpoint propio en la spec; ver si va en esta respuesta o en uno nuevo.
 */
export async function getPlan(year: number): Promise<TrainingPlan | null> {
  throw new Error('Not implemented: getPlan');
}

/**
 * PUT /training-plans/{year}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Modificar un mes con capacitaciones dictadas no altera lo ya dictado.
 * TODO(M5): Errores: 400 si algún tema no existe o está inactivo.
 */
export async function upsertPlan(year: number, plan: TrainingPlan): Promise<TrainingPlan> {
  throw new Error('Not implemented: upsertPlan');
}

/**
 * POST /training-plans/{year}/copy-from/{source_year}
 * PERMISOS: Gerente
 * TODO(M5): Errores: 404 si el año de origen no tiene plan.
 * TODO(consultar a Santi): qué pasa si el año destino ya tiene plan (¿pisa, 409?).
 */
export async function copyPlan(year: number, sourceYear: number): Promise<TrainingPlan> {
  throw new Error('Not implemented: copyPlan');
}
