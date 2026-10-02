/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { ComplianceItem, ComplianceFilters } from './types';

/**
 * GET /compliance/upcoming
 * PERMISOS: Gerente, Capacitador
 * REGLA DE NEGOCIO: Calculado desde la fecha del último curso aprobado por persona y tema, más la periodicidad del tema.
 * TODO(M8): Invoca la Edge Function compliance-upcoming.
 */
export async function getUpcomingCompliance(filters: ComplianceFilters): Promise<ComplianceItem[]> {
  throw new Error('Not implemented: getUpcomingCompliance');
}
