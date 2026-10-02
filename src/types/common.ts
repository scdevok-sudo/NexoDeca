/**
 * types/common.ts — Tipos compartidos por varios módulos.
 * Módulo: Setup.
 *
 * TODO(SETUP): reemplazar lo que se pueda por los tipos generados (database.types.ts).
 */

export type UUID = string;
/** Fecha en formato AAAA-MM-DD. */
export type ISODate = string;

export type Role = 'gerente' | 'capacitador';
export type TopicType = 'obligatorio' | 'electivo';
export type AttendanceResult = 'aprobado' | 'no_aprobado';
// TODO(M6): la spec habla de "cerrar" y de "anulada"; el estado inicial (abierta) es una suposición.
export type TrainingStatus = 'abierta' | 'cerrada' | 'anulada';
/** Si el tema le correspondía a la persona según su puesto (spec §6). */
export type Applicability = 'obligatorio' | 'electivo' | 'no_corresponde';

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Errores HTTP que documenta la spec. */
export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409;

export interface ApiErrorBody {
  status: ApiErrorStatus;
  message: string;
  details?: unknown;
}
