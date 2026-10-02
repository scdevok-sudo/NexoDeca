/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { Position, PositionInput } from './types';

/**
 * GET /positions
 * PERMISOS: Gerente, Capacitador
 * TODO(M3): Para los selectores solo activos; para el ABM del Gerente, todos.
 */
export async function listPositions(opts?: { incluirInactivos?: boolean }): Promise<Position[]> {
  throw new Error('Not implemented: listPositions');
}

/**
 * POST /positions
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Nombre único.
 * TODO(M3): Errores: 400; 409 nombre duplicado.
 */
export async function createPosition(input: PositionInput): Promise<Position> {
  throw new Error('Not implemented: createPosition');
}

/**
 * PUT /positions/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Un puesto inactivo no se puede asignar a personal ni temas nuevos.
 * TODO(M3): Errores: 400; 404; 409 nombre duplicado.
 */
export async function updatePosition(id: UUID, input: PositionInput): Promise<Position> {
  throw new Error('Not implemented: updatePosition');
}

/**
 * DELETE /positions/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: No se elimina un puesto con personal o temas asociados: se desactiva.
 * TODO(M3): Errores: 409 si tiene asociaciones activas y se intenta eliminar en vez de desactivar.
 */
export async function deletePosition(id: UUID): Promise<void> {
  throw new Error('Not implemented: deletePosition');
}
