/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID } from '../../types/common';

export interface Position {
  id: UUID;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface PositionInput {
  nombre: string;
  descripcion: string;
  activo: boolean;
}
