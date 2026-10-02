/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate } from '../../types/common';

export interface Person {
  id: UUID;
  dni: string;
  nombre: string;
  apellido: string;
  puestoId: UUID;
  /** Nombre del puesto actual (solo para mostrar en tabla). */
  puestoNombre?: string;
  fechaIngreso: ISODate;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonnelFilters {
  dni?: string;
  q?: string; // nombre/apellido
  puestoId?: UUID;
  /** Por defecto 'activos' (spec: GET /personnel lista solo activos). */
  estado?: 'activos' | 'inactivos' | 'todos';
  orden?: 'apellido_nombre' | 'fecha_ingreso';
  page: number;
}

export interface PersonInput {
  dni: string;
  nombre: string;
  apellido: string;
  puestoId: UUID;
  fechaIngreso: ISODate;
}

export interface ImportRejection {
  fila: number;
  motivo: string;
}

/** Salida de POST /personnel/import. */
export interface ImportReport {
  procesados: number;
  importados: number;
  rechazados: ImportRejection[];
}
