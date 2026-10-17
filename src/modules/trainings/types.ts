/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate, TrainingStatus, AttendanceResult, Applicability, TopicType } from '../../types/common';

export interface TrainingAttendee {
  personId: UUID;
  dni: string;
  nombre: string;
  apellido: string;
  resultado: AttendanceResult;
  /** REGLA DE NEGOCIO: puesto al momento del curso, guardado como dato de la asistencia (no referencia viva). */
  puestoIdAlDictar: UUID;
  puestoNombreAlDictar: string | null;
  /** Lo calcula el servidor según el puesto y el tema. */
  aplicabilidad: Applicability;
}

export interface Training {
  id: UUID;
  /** Correlativo automático, nunca se reutiliza. */
  nroRegistro: number;
  topicId: UUID;
  topicNombre: string;
  fecha: ISODate;
  capacitadorId: UUID;
  capacitadorNombre: string | null;
  duracionHoras: number;
  temario: string;
  estado: TrainingStatus;
  /** Con certificados generados (M7) no se edita ni se anula. */
  tieneCertificados: boolean;
}

/** Fila del listado: sin el detalle de asistentes, con la cantidad. */
export interface TrainingListItem extends Training {
  cantidadAsistentes: number;
}

export interface TrainingDetail extends Training {
  asistentes: TrainingAttendee[];
}

export interface TrainingFilters {
  topicId?: UUID;
  fechaDesde?: ISODate;
  fechaHasta?: ISODate;
  capacitadorId?: UUID;
  estado?: TrainingStatus;
  page: number;
}

export interface TrainingInput {
  topicId: UUID;
  fecha: ISODate;
  duracionHoras: number;
  temario: string;
  asistentes: { personId: UUID; resultado: AttendanceResult }[];
}

/** Tema para el formulario: con tipo y puestos, para anticipar la correspondencia antes de guardar. */
export interface TopicOption {
  id: UUID;
  nombre: string;
  tipo: TopicType;
  activo: boolean;
  puestoIds: UUID[];
}

/** Persona para el selector de asistentes (solo activas). */
export interface PersonOption {
  id: UUID;
  dni: string;
  nombre: string;
  apellido: string;
  puestoId: UUID;
  puestoNombre: string | null;
}
