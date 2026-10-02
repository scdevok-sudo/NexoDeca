/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID } from '../../types/common';

export interface MonthlyReport {
  id: UUID;
  year: number;
  month: number;
  generadoEl: string;
  /** Formato a definir con Juan: PDF o Excel. */
  formato: 'pdf' | 'xlsx';
  downloadUrl: string;
}

export interface MonthYear {
  year: number;
  month: number;
}
