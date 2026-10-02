/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, TopicType } from '../../types/common';

export interface TrainingTopic {
  id: UUID;
  nombre: string;
  tipo: TopicType;
  puestoIds: UUID[];
  /** null = no vence (ej. inducción única). */
  periodicidadMeses: number | null;
  duracionHoras: number;
  activo: boolean;
}

export interface TopicFilters {
  q?: string;
  tipo?: TopicType;
  puestoId?: UUID;
  page: number;
}

export interface TopicInput {
  nombre: string;
  tipo: TopicType;
  puestoIds: UUID[];
  periodicidadMeses: number | null;
  duracionHoras: number;
  activo: boolean;
}
