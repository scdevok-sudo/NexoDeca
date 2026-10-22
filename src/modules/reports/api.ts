/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 *
 * Los archivos viven en un bucket privado (0016): se descargan con URLs firmadas de vida corta que arman las Edge
 *   Functions monthly-report (al generar) y report-download (historial).
 */

import { supabase } from '../../lib/supabase';
import { ApiError, fromFunctionsError, fromPostgrestError } from '../../lib/apiError';
import type { UUID } from '../../types/common';
import type { GeneratedReport, MonthlyReport } from './types';
import { monthYearSchema } from './schemas';

const ERRORS = {
  '42501': 'No tenés permiso para ver los reportes',
};

/**
 * GET /reports/monthly/{year}/{month} → Edge Function monthly-report.
 * PERMISOS: Gerente, Capacitador (lo verifica la Edge Function).
 * REGLA DE NEGOCIO: Puede generarse con el mes en curso incompleto; un mes futuro, no.
 * REGLA DE NEGOCIO: El reporte queda guardado como archivo histórico; generar el mismo mes otra vez crea una versión
 *   nueva (la anterior queda).
 * Errores: 400 año/mes inválidos o mes futuro.
 */
export async function generateMonthlyReport(year: number, month: number): Promise<GeneratedReport> {
  const parsed = monthYearSchema.safeParse({ year, month });
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Mes inválido');

  const { data, error } = await supabase.functions.invoke<{
    id: string;
    anio: number;
    mes: number;
    version: number;
    downloadUrl: string;
  }>('monthly-report', { body: { year, month } });
  if (error) throw await fromFunctionsError(error);
  if (!data) throw new ApiError(500, 'Respuesta vacía del servidor');
  return { id: data.id, year: data.anio, month: data.mes, version: data.version, downloadUrl: data.downloadUrl };
}

/**
 * Historial de reportes generados (tabla monthly_reports, 0022), lo más nuevo primero.
 * PERMISOS: Gerente, Capacitador (RLS monthly_reports_select).
 * No está en la spec como endpoint, pero hace falta para "descargar reportes de meses anteriores" (spec §9).
 */
export async function listMonthlyReports(): Promise<MonthlyReport[]> {
  const { data, error } = await supabase
    .from('monthly_reports')
    .select(
      'id, anio, mes, version, formato, created_at, cantidad_capacitaciones, cantidad_participantes, profiles(nombre)',
    )
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .order('version', { ascending: false });
  if (error) throw fromPostgrestError(error, ERRORS);

  const rows = (data ?? []) as unknown as {
    id: string;
    anio: number;
    mes: number;
    version: number;
    formato: 'xlsx';
    created_at: string;
    cantidad_capacitaciones: number;
    cantidad_participantes: number;
    profiles: { nombre: string } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    year: r.anio,
    month: r.mes,
    version: r.version,
    formato: r.formato,
    generadoEl: r.created_at,
    generadoPor: r.profiles?.nombre ?? null,
    cantidadCapacitaciones: r.cantidad_capacitaciones,
    cantidadParticipantes: r.cantidad_participantes,
  }));
}

/**
 * Descarga de un reporte del historial → Edge Function report-download.
 * PERMISOS: Gerente, Capacitador. Devuelve una URL firmada que vence a los 2 minutos.
 */
export async function getReportDownloadUrl(id: UUID): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>('report-download', { body: { reportId: id } });
  if (error) throw await fromFunctionsError(error);
  if (!data?.url) throw new ApiError(500, 'Respuesta vacía del servidor');
  return data.url;
}
