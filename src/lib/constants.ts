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
// Estados del enum training_status (0014). El "cierre" que dispara los certificados es de M7: TODO(consultar a Santi).
export const TRAINING_STATUSES = ['activa', 'anulada'] as const;

/** REGLA DE NEGOCIO: paginación del lado del servidor, 25 registros por página (spec §2, §4). */
export const PAGE_SIZE = 25;

/** Días hacia adelante para "próximo a vencer" (spec §8, endpoint GET /compliance/upcoming). */
export const DEFAULT_UPCOMING_DAYS = 15;
