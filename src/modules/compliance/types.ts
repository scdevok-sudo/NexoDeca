/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate } from '../../types/common';

export interface ComplianceItem {
  personId: UUID;
  personaNombre: string;
  puestoNombre: string;
  topicId: UUID;
  temaNombre: string;
  /** null = nunca tomó el curso. TODO(M8): definir cómo se muestra. */
  ultimoAprobado: ISODate | null;
  venceEl: ISODate | null;
  estado: 'vencida' | 'por_vencer';
}

export interface ComplianceFilters {
  puestoId?: UUID;
  topicId?: UUID;
  /** Rango de días hacia adelante. Default 15. */
  dias?: number;
}
