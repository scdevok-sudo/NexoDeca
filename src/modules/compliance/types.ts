/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate } from '../../types/common';

/**
 * nunca: el tema le corresponde y nunca lo aprobó (decidido con Lucas, 2026-10-17: se muestra).
 * vencida: ya venció · por_vencer: vence dentro del rango de días.
 */
export type ComplianceStatus = 'nunca' | 'vencida' | 'por_vencer';

export interface ComplianceItem {
  personId: UUID;
  dni: string;
  personaNombre: string;
  puestoNombre: string;
  topicId: UUID;
  temaNombre: string;
  periodicidadMeses: number;
  /** null = nunca aprobó el curso. */
  ultimoAprobado: ISODate | null;
  venceEl: ISODate | null;
  estado: ComplianceStatus;
  /** Negativo si ya venció; null si nunca lo aprobó. */
  diasRestantes: number | null;
}

export interface ComplianceFilters {
  puestoId?: UUID;
  topicId?: UUID;
  /** Rango de días hacia adelante. Default 15. */
  dias?: number;
}
