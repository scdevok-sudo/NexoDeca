/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate, TrainingStatus, AttendanceResult, Applicability } from '../../types/common';

export interface TrainingAttendee {
  personId: UUID;
  resultado: AttendanceResult;
  /** REGLA DE NEGOCIO: puesto al momento del curso, guardado como dato de la asistencia (no referencia viva). */
  puestoIdAlDictar: UUID;
  /** Lo calcula el servidor según el puesto y el tema. */
  aplicabilidad: Applicability;
}

export interface Training {
  id: UUID;
  topicId: UUID;
  fecha: ISODate;
  capacitadorId: UUID;
  duracionHoras: number;
  temario: string;
  /** Correlativo automático, nunca se reutiliza. */
  nroRegistro: number;
  estado: TrainingStatus;
  asistentes: TrainingAttendee[];
}

export interface TrainingFilters {
  topicId?: UUID;
  fechaDesde?: ISODate;
  fechaHasta?: ISODate;
  capacitadorId?: UUID;
  page: number;
}

export interface TrainingInput {
  topicId: UUID;
  fecha: ISODate;
  duracionHoras: number;
  temario: string;
  asistentes: { personId: UUID; resultado: AttendanceResult }[];
}
