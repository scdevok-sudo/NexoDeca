/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import { supabase } from '../../lib/supabase';
import { PAGE_SIZE } from '../../lib/constants';
import { ApiError, fromFunctionsError, fromPostgrestError } from '../../lib/apiError';
import type { Paginated, UUID } from '../../types/common';
import type { Person, PersonnelFilters, PersonInput, ImportReport } from './types';
import { IMPORT_MAX_BYTES, personSchema, personnelFiltersSchema } from './schemas';

const COLUMNS = 'id, dni, nombre, apellido, position_id, fecha_ingreso, activo, created_at, updated_at, positions(nombre)';

interface PersonRow {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  position_id: string;
  fecha_ingreso: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  positions: { nombre: string } | null;
}

const ERRORS = {
  '23505': 'Ya existe una persona con ese DNI',
  '23503': 'El puesto seleccionado no existe',
  '23514': 'Hay datos con formato inválido',
  '42501': 'No tenés permiso para modificar el personal',
  PGRST116: 'La persona no existe',
};

function toPerson(r: PersonRow): Person {
  return {
    id: r.id,
    dni: r.dni,
    nombre: r.nombre,
    apellido: r.apellido,
    puestoId: r.position_id,
    puestoNombre: r.positions?.nombre,
    fechaIngreso: r.fecha_ingreso,
    activo: r.activo,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Saca los caracteres con significado en la sintaxis de filtros de PostgREST (`,` `(` `)` `.` `:` `"`)
 * y los comodines (`*` `%` `\`), para que el texto del usuario no pueda alterar el filtro `.or()`.
 */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,().:"*%\\]/g, ' ').trim();
}

function parsePersonInput(input: PersonInput) {
  const parsed = personSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Datos inválidos', parsed.error.issues);
  const d = parsed.data;
  return {
    dni: d.dni,
    nombre: d.nombre,
    apellido: d.apellido,
    position_id: d.puestoId,
    fecha_ingreso: d.fechaIngreso,
    activo: d.activo,
  };
}

/**
 * GET /personnel
 * PERMISOS: Gerente, Capacitador (solo lectura)
 * REGLA DE NEGOCIO: por defecto solo personas activas. Paginación server-side de PAGE_SIZE (25).
 * Errores: 400 si los filtros son inválidos.
 */
export async function listPersonnel(filters: PersonnelFilters): Promise<Paginated<Person>> {
  const parsed = personnelFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new ApiError(400, 'Filtros inválidos', parsed.error.issues);
  const f = parsed.data;

  let query = supabase.from('personnel').select(COLUMNS, { count: 'exact' });

  if (f.dni) query = query.like('dni', `${f.dni}%`);

  // Cada palabra tiene que aparecer en el nombre o en el apellido (las palabras se combinan con AND).
  const words = sanitizeSearchTerm(f.q ?? '').split(/\s+/).filter(Boolean).slice(0, 5);
  for (const w of words) query = query.or(`nombre.ilike.*${w}*,apellido.ilike.*${w}*`);

  if (f.puestoId) query = query.eq('position_id', f.puestoId);

  const estado = f.estado ?? 'activos';
  if (estado === 'activos') query = query.eq('activo', true);
  if (estado === 'inactivos') query = query.eq('activo', false);

  if (f.orden === 'fecha_ingreso') {
    query = query.order('fecha_ingreso', { ascending: false }).order('apellido').order('nombre');
  } else {
    query = query.order('apellido').order('nombre');
  }
  // Desempate estable para que la paginación no repita ni saltee filas.
  query = query.order('id');

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  // PGRST103: página fuera de rango → lista vacía en vez de error.
  if (error && error.code !== 'PGRST103') throw fromPostgrestError(error, ERRORS);

  return {
    data: ((data ?? []) as unknown as PersonRow[]).map(toPerson),
    page: f.page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
  };
}

/**
 * GET /personnel/{id}
 * (no está en la spec, necesaria) para la ficha de la persona.
 * PERMISOS: Gerente, Capacitador. Errores: 404.
 */
export async function getPerson(id: UUID): Promise<Person> {
  const { data, error } = await supabase.from('personnel').select(COLUMNS).eq('id', id).single();
  if (error) throw fromPostgrestError(error, ERRORS);
  return toPerson(data as unknown as PersonRow);
}

/**
 * POST /personnel
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: DNI único; el puesto debe existir y estar activo.
 * Errores: 400 datos inválidos; 409 DNI duplicado.
 */
export async function createPerson(input: PersonInput): Promise<Person> {
  // `activo` no se manda en el alta: siempre arranca en true (default de la base).
  const { activo: _activo, ...insertRow } = parsePersonInput(input);
  const { data, error } = await supabase.from('personnel').insert(insertRow).select(COLUMNS).single();
  if (error) throw fromPostgrestError(error, ERRORS);
  return toPerson(data as unknown as PersonRow);
}

/**
 * PUT /personnel/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: el cambio de puesto no afecta lo ya dictado (el puesto histórico vive en training_attendees, M6).
 * Errores: 404; 400; 409 si el DNI corresponde a otra persona.
 */
export async function updatePerson(id: UUID, input: PersonInput): Promise<Person> {
  const { activo, ...rest } = parsePersonInput(input);
  const row = activo === undefined ? rest : { ...rest, activo };
  const { data, error } = await supabase.from('personnel').update(row).eq('id', id).select(COLUMNS).single();
  // Si RLS no deja actualizar, PostgREST devuelve 0 filas → PGRST116 → 404.
  if (error) throw fromPostgrestError(error, ERRORS);
  return toPerson(data as unknown as PersonRow);
}

/**
 * DELETE /personnel/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: nunca se borra físicamente (CLAUDE.md regla 6): siempre se desactiva.
 *   Así el historial (capacitaciones, certificados) sigue visible.
 * Errores: 404.
 */
export async function deactivatePerson(id: UUID): Promise<void> {
  const { error } = await supabase.from('personnel').update({ activo: false }).eq('id', id).select('id').single();
  if (error) throw fromPostgrestError(error, ERRORS);
}

/**
 * POST /personnel/import
 * PERMISOS: Gerente (lo verifica la Edge Function import-personnel).
 * REGLA DE NEGOCIO: informa procesados, importados y rechazados, con el motivo de cada rechazo.
 * Errores: 400 si el archivo no respeta el formato esperado.
 */
export async function importPersonnel(file: File): Promise<ImportReport> {
  if (!file.name.toLowerCase().endsWith('.csv')) throw new ApiError(400, 'El archivo tiene que ser .csv');
  if (file.size === 0) throw new ApiError(400, 'El archivo está vacío');
  if (file.size > IMPORT_MAX_BYTES) throw new ApiError(400, 'El archivo supera 1 MB');

  const body = new FormData();
  body.append('file', file);
  const { data, error } = await supabase.functions.invoke<ImportReport>('import-personnel', { body });
  if (error) throw await fromFunctionsError(error);
  if (!data) throw new ApiError(500, 'Respuesta vacía del servidor');
  return data;
}