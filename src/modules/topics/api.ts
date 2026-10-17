/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import { supabase } from '../../lib/supabase';
import { PAGE_SIZE } from '../../lib/constants';
import { ApiError, fromPostgrestError } from '../../lib/apiError';
import type { Paginated, UUID } from '../../types/common';
import type { TrainingTopic, TopicFilters, TopicInput } from './types';
import { topicFiltersSchema, topicSchema } from './schemas';

// `puestos` trae TODOS los puestos del tema. Para filtrar por puesto se agrega aparte un segundo embed
// `!inner` (ver listTopics): si se filtrara sobre `puestos`, el tema llegaría solo con el puesto filtrado.
const COLUMNS =
  'id, nombre, tipo, periodicidad_meses, duracion_horas, activo, puestos:training_topic_positions(position_id)';

interface TopicRow {
  id: string;
  nombre: string;
  tipo: 'obligatorio' | 'electivo';
  periodicidad_meses: number | null;
  duracion_horas: number;
  activo: boolean;
  puestos: { position_id: string }[];
}

const ERRORS = {
  '23505': 'Ya existe un tema con ese nombre',
  '23503': 'Alguno de los puestos seleccionados no existe',
  '23514': 'Hay datos con formato inválido',
  '42501': 'No tenés permiso para modificar el catálogo de temas',
  PGRST116: 'El tema no existe',
};

function toTopic(r: TopicRow): TrainingTopic {
  return {
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    puestoIds: r.puestos.map((p) => p.position_id),
    periodicidadMeses: r.periodicidad_meses,
    duracionHoras: Number(r.duracion_horas),
    activo: r.activo,
  };
}

/** Saca los comodines de LIKE (`%` `_` `\`) para que el texto del usuario se busque literal. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_\\]/g, ' ').trim();
}

/**
 * GET /training-topics
 * PERMISOS: Gerente, Capacitador (RLS: training_topics_select)
 * REGLA DE NEGOCIO: búsqueda por nombre, tipo y puesto. Paginación server-side de PAGE_SIZE (25).
 * Errores: 400 si los filtros son inválidos.
 */
export async function listTopics(filters: TopicFilters): Promise<Paginated<TrainingTopic>> {
  const parsed = topicFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new ApiError(400, 'Filtros inválidos', parsed.error.issues);
  const f = parsed.data;

  const select = f.puestoId ? `${COLUMNS}, filtro_puesto:training_topic_positions!inner(position_id)` : COLUMNS;
  let query = supabase.from('training_topics').select(select, { count: 'exact' });

  const q = sanitizeSearchTerm(f.q ?? '');
  if (q) query = query.ilike('nombre', `%${q}%`);

  if (f.tipo) query = query.eq('tipo', f.tipo);

  if (f.puestoId) query = query.eq('filtro_puesto.position_id', f.puestoId);

  // Desempate por id para que la paginación no repita ni saltee filas.
  query = query.order('nombre').order('id');

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  // PGRST103: página fuera de rango → lista vacía en vez de error.
  if (error && error.code !== 'PGRST103') throw fromPostgrestError(error, ERRORS);

  return {
    data: ((data ?? []) as unknown as TopicRow[]).map(toTopic),
    page: f.page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
  };
}

function parseTopicInput(input: TopicInput) {
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Datos inválidos', parsed.error.issues);
  const d = parsed.data;
  return {
    row: {
      nombre: d.nombre,
      tipo: d.tipo,
      periodicidad_meses: d.periodicidadMeses,
      duracion_horas: d.duracionHoras,
      activo: d.activo,
    },
    // Sin repetidos: la PK (topic_id, position_id) rechazaría el insert.
    puestoIds: [...new Set(d.puestoIds)],
  };
}

async function getTopic(id: UUID): Promise<TrainingTopic> {
  const { data, error } = await supabase.from('training_topics').select(COLUMNS).eq('id', id).single();
  if (error) throw fromPostgrestError(error, ERRORS);
  return toTopic(data as unknown as TopicRow);
}

async function insertTopicPositions(topicId: UUID, puestoIds: UUID[]) {
  if (puestoIds.length === 0) return null;
  const { error } = await supabase
    .from('training_topic_positions')
    .insert(puestoIds.map((position_id) => ({ topic_id: topicId, position_id })));
  return error;
}

/**
 * POST /training-topics
 * PERMISOS: Gerente (RLS: training_topics_insert, training_topic_positions_insert)
 * REGLA DE NEGOCIO: Nombre único; solo puestos activos (el form solo ofrece activos; en la base lo valida el
 *   trigger ensure_position_active de 0017_positions.sql, M3).
 * Errores: 400; 409 nombre duplicado.
 */
export async function createTopic(input: TopicInput): Promise<TrainingTopic> {
  const { row, puestoIds } = parseTopicInput(input);
  // `activo` no se manda en el alta: siempre arranca en true (default de la base).
  const { activo: _activo, ...insertRow } = row;
  const { data, error } = await supabase.from('training_topics').insert(insertRow).select('id').single();
  if (error) throw fromPostgrestError(error, ERRORS);

  // TODO(M4): son dos inserts separados (no atómicos). Si falla el segundo, el tema queda creado sin puestos y no se
  //   puede borrar (nunca DELETE físico). Para hacerlo atómico haría falta una función en la base (RPC).
  //   TODO(consultar a Santi): ¿vale la pena la RPC o alcanza con avisar y que se complete editando?
  const posError = await insertTopicPositions(data.id, puestoIds);
  if (posError) {
    const err = fromPostgrestError(posError, ERRORS);
    throw new ApiError(err.status, `El tema se creó, pero no se pudieron asignar los puestos: ${err.message}. Editalo para completarlos.`);
  }
  return getTopic(data.id);
}

/**
 * PUT /training-topics/{id}
 * PERMISOS: Gerente (RLS: training_topics_update, training_topic_positions_insert/delete)
 * REGLA DE NEGOCIO: Cambiar puestos no afecta capacitaciones ya dictadas: la correspondencia de cada asistente
 *   queda guardada en training_attendees (M6) al momento del dictado.
 * Errores: 400; 404; 409 nombre duplicado.
 */
export async function updateTopic(id: UUID, input: TopicInput): Promise<TrainingTopic> {
  const { row, puestoIds } = parseTopicInput(input);
  const { data, error } = await supabase
    .from('training_topics')
    .update(row)
    .eq('id', id)
    .select('puestos:training_topic_positions(position_id)')
    .single();
  // Si RLS no deja actualizar, PostgREST devuelve 0 filas → PGRST116 → 404.
  if (error) throw fromPostgrestError(error, ERRORS);

  // Solo se tocan los puestos que cambiaron: los que siguen asignados (aunque hoy estén inactivos) quedan igual.
  const actuales = new Set((data as unknown as Pick<TopicRow, 'puestos'>).puestos.map((p) => p.position_id));
  const quitar = [...actuales].filter((pid) => !puestoIds.includes(pid));
  const agregar = puestoIds.filter((pid) => !actuales.has(pid));

  // TODO(M4): igual que en createTopic, no es atómico (ver TODO de arriba).
  if (quitar.length > 0) {
    const { error: delError } = await supabase
      .from('training_topic_positions')
      .delete()
      .eq('topic_id', id)
      .in('position_id', quitar);
    if (delError) throw fromPostgrestError(delError, ERRORS);
  }
  const posError = await insertTopicPositions(id, agregar);
  if (posError) throw fromPostgrestError(posError, ERRORS);

  return getTopic(id);
}

/**
 * DELETE /training-topics/{id}
 * PERMISOS: Gerente (RLS: training_topics_update)
 * REGLA DE NEGOCIO: nunca se borra físicamente (CLAUDE.md regla 6): se desactiva. Un tema inactivo no puede
 *   incorporarse a un plan nuevo (M5), pero lo ya dictado con ese tema mantiene su historial sin cambios.
 *   Se reactiva editándolo (checkbox "Activo").
 * Errores: 404.
 */
export async function deactivateTopic(id: UUID): Promise<void> {
  const { error } = await supabase.from('training_topics').update({ activo: false }).eq('id', id).select('id').single();
  if (error) throw fromPostgrestError(error, ERRORS);
}
