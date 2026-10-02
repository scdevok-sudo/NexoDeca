/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { MonthlyReport, MonthYear } from './types';

/**
 * GET /reports/monthly/{year}/{month}
 * PERMISOS: Gerente, Capacitador
 * REGLA DE NEGOCIO: Puede generarse con el mes en curso incompleto.
 * REGLA DE NEGOCIO: El reporte queda guardado como archivo histórico.
 * TODO(M9): Invoca la Edge Function monthly-report.
 */
export async function generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  throw new Error('Not implemented: generateMonthlyReport');
}

/**
 * GET reports (histórico)
 * PERMISOS: Gerente, Capacitador
 * TODO(consultar a Santi): la spec pide descargar meses anteriores pero no define el listado del histórico.
 */
export async function listMonthlyReports(): Promise<MonthlyReport[]> {
  throw new Error('Not implemented: listMonthlyReports');
}
