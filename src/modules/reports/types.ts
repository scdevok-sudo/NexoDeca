/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID } from '../../types/common';

export type ReportFormat = 'xlsx' | 'pdf';

/** Un reporte del historial (tabla monthly_reports, 0022). */
export interface MonthlyReport {
  id: UUID;
  year: number;
  month: number;
  /** Generar el mismo mes otra vez crea una versión nueva; la anterior queda. */
  version: number;
  /** Excel o PDF (migración 0025). */
  formato: ReportFormat;
  generadoEl: string;
  generadoPor: string | null;
  cantidadCapacitaciones: number;
  cantidadParticipantes: number;
}

/** Lo que devuelve generar un reporte: el registro + la URL firmada para descargarlo ya. */
export interface GeneratedReport {
  id: UUID;
  year: number;
  month: number;
  version: number;
  formato: ReportFormat;
  downloadUrl: string;
}

export interface MonthYear {
  year: number;
  month: number;
}
