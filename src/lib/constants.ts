/**
 * lib/constants.ts — Constantes compartidas (roles, estados, paginación).
 * Módulo: Setup.
 */

import type { Role } from '../types/common';

export const ROLES: Record<'GERENTE' | 'CAPACITADOR', Role> = {
  GERENTE: 'gerente',
  CAPACITADOR: 'capacitador',
};

export const TOPIC_TYPES = ['obligatorio', 'electivo'] as const;
export const ATTENDANCE_RESULTS = ['aprobado', 'no_aprobado'] as const;
// TODO(M6): confirmar los estados de una capacitación (la spec nombra "cerrar" y "anulada").
export const TRAINING_STATUSES = ['abierta', 'cerrada', 'anulada'] as const;

/** REGLA DE NEGOCIO: paginación del lado del servidor, 25 registros por página (spec §2, §4). */
export const PAGE_SIZE = 25;

/** Días hacia adelante para "próximo a vencer" (spec §8, endpoint GET /compliance/upcoming). */
export const DEFAULT_UPCOMING_DAYS = 15;
