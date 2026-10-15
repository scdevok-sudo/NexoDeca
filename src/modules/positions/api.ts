/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import { supabase } from '../../lib/supabase';
import { ApiError, fromPostgrestError } from '../../lib/apiError';
import type { UUID } from '../../types/common';
import type { Position, PositionInput } from './types';
import { positionSchema } from './schemas';

const COLUMNS = 'id, nombre, descripcion, activo';

const ERRORS = {
  '23505': 'Ya existe un puesto con ese nombre',
  '23514': 'Hay datos con formato inválido',
  '42501': 'No tenés permiso para modificar los puestos',
  PGRST116: 'El puesto no existe',
};

function parsePositionInput(input: PositionInput) {
  const parsed = positionSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Datos inválidos', parsed.error.issues);
  return parsed.data;
}

/**
 * GET /positions
 * PERMISOS: Gerente, Capacitador
 * Para los selectores solo activos; para el ABM y los filtros de lo histórico, todos.
 */
export async function listPositions(opts?: { incluirInactivos?: boolean }): Promise<Position[]> {
  let query = supabase.from('positions').select(COLUMNS).order('nombre');
  if (!opts?.incluirInactivos) query = query.eq('activo', true);
  const { data, error } = await query;
  if (error) throw fromPostgrestError(error, ERRORS);
  return (data ?? []) as Position[];
}

/**
 * POST /positions
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: nombre único. Un puesto nuevo siempre arranca activo.
 * Errores: 400; 409 nombre duplicado.
 */
export async function createPosition(input: PositionInput): Promise<Position> {
  const { nombre, descripcion } = parsePositionInput(input);
  const { data, error } = await supabase.from('positions').insert({ nombre, descripcion }).select(COLUMNS).single();
  if (error) throw fromPostgrestError(error, ERRORS);
  return data as Position;
}

/**
 * PUT /positions/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: desactivarlo no toca a quienes ya lo tienen; solo impide asignarlo a personal o temas nuevos
 *   (trigger ensure_position_active en la base).
 * Errores: 400; 404; 409 nombre duplicado.
 */
export async function updatePosition(id: UUID, input: PositionInput): Promise<Position> {
  const row = parsePositionInput(input);
  const { data, error } = await supabase.from('positions').update(row).eq('id', id).select(COLUMNS).single();
  // Si RLS no deja actualizar, PostgREST devuelve 0 filas → PGRST116 → 404.
  if (error) throw fromPostgrestError(error, ERRORS);
  return data as Position;
}

/**
 * DELETE /positions/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: nunca se borra físicamente (CLAUDE.md regla 6, ficha M3: "DELETE … (desactiva)"):
 *   siempre se desactiva, tenga o no personal o temas asociados. La base además bloquea el DELETE.
 * TODO(consultar a Santi): la spec menciona un 409 "si se intenta eliminar en vez de desactivar"; con borrado lógico
 *   ese caso no se da. Confirmar que alcanza con desactivar.
 * Errores: 404.
 */
export async function deletePosition(id: UUID): Promise<void> {
  const { error } = await supabase.from('positions').update({ activo: false }).eq('id', id).select('id').single();
  if (error) throw fromPostgrestError(error, ERRORS);
}

/**
 * (no está en la spec, necesaria) Cantidad de personas activas con este puesto, para avisarle al Gerente
 * antes de desactivarlo.
 * PERMISOS: Gerente, Capacitador (RLS de personnel).
 */
export async function countActivePersonnel(positionId: UUID): Promise<number> {
  const { count, error } = await supabase
    .from('personnel')
    .select('id', { count: 'exact', head: true })
    .eq('position_id', positionId)
    .eq('activo', true);
  if (error) throw fromPostgrestError(error, ERRORS);
  return count ?? 0;
}
