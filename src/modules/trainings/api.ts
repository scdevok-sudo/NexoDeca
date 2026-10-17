/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 *
 * Lectura: select directo (RLS de 0014: Gerente ve todas, Capacitador las propias).
 * Escritura: SOLO por las RPC de 0019 (create_training, update_training, void_training), que hacen todo en una
 *   transacción y validan del lado del servidor.
 */

import { supabase } from '../../lib/supabase';
import { PAGE_SIZE } from '../../lib/constants';
import { ApiError, fromPostgrestError } from '../../lib/apiError';
import type { Applicability, AttendanceResult, Paginated, TopicType, TrainingStatus, UUID } from '../../types/common';
import type {
  PersonOption,
  TopicOption,
  TrainingDetail,
  TrainingFilters,
  TrainingInput,
  TrainingListItem,
} from './types';
import { trainingFiltersSchema, trainingSchema } from './schemas';

const BASE_COLUMNS =
  'id, numero_registro, topic_id, fecha_dictado, capacitador_id, duracion_real, temario, estado, tiene_certificados, ' +
  'training_topics(nombre), profiles(nombre)';
const LIST_COLUMNS = `${BASE_COLUMNS}, training_attendees(count)`;
const DETAIL_COLUMNS =
  `${BASE_COLUMNS}, training_attendees(person_id, resultado, correspondencia, puesto_id_snapshot, ` +
  'personnel(dni, nombre, apellido), positions(nombre))';

interface BaseRow {
  id: string;
  numero_registro: number;
  topic_id: string;
  fecha_dictado: string;
  capacitador_id: string;
  duracion_real: number;
  temario: string | null;
  estado: TrainingStatus;
  tiene_certificados: boolean;
  training_topics: { nombre: string } | null;
  /** null si RLS no deja ver el perfil (el Capacitador solo ve el suyo). */
  profiles: { nombre: string } | null;
}

interface ListRow extends BaseRow {
  training_attendees: { count: number }[];
}

interface DetailRow extends BaseRow {
  training_attendees: {
    person_id: string;
    resultado: AttendanceResult;
    correspondencia: Applicability;
    puesto_id_snapshot: string;
    personnel: { dni: string; nombre: string; apellido: string } | null;
    positions: { nombre: string } | null;
  }[];
}

const ERRORS = {
  '23505': 'Hay personas repetidas en la lista de asistentes',
  '23503': 'Alguno de los datos seleccionados no existe',
  '23514': 'Hay datos con formato inválido',
  '42501': 'No tenés permiso para esta acción',
  PGRST116: 'La capacitación no existe',
};

/**
 * Errores de las RPC de 0019: el HINT trae el status cuando no es un 400 ('404' / '409'); el mensaje es para el
 * usuario. El resto se traduce como cualquier error de PostgREST.
 */
function fromRpcError(err: { code?: string; message: string; hint?: string | null }): ApiError {
  if (err.hint === '404' || err.hint === '409') return new ApiError(Number(err.hint), err.message);
  // 42501 levantado a propósito por las RPC: el mensaje ya es para el usuario.
  if (err.code === '42501' && err.message) return new ApiError(403, err.message);
  return fromPostgrestError(err, ERRORS);
}

function toTraining(r: BaseRow) {
  return {
    id: r.id,
    nroRegistro: r.numero_registro,
    topicId: r.topic_id,
    topicNombre: r.training_topics?.nombre ?? 'Tema desconocido',
    fecha: r.fecha_dictado,
    capacitadorId: r.capacitador_id,
    capacitadorNombre: r.profiles?.nombre ?? null,
    duracionHoras: Number(r.duracion_real),
    temario: r.temario ?? '',
    estado: r.estado,
    tieneCertificados: r.tiene_certificados,
  };
}

function toRpcArgs(input: TrainingInput) {
  const parsed = trainingSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Datos inválidos', parsed.error.issues);
  const d = parsed.data;
  return {
    p_topic_id: d.topicId,
    p_fecha: d.fecha,
    p_duracion: d.duracionHoras,
    p_temario: d.temario,
    p_asistentes: d.asistentes.map((a) => ({ person_id: a.personId, resultado: a.resultado })),
  };
}

/** Saca los caracteres con significado en los filtros de PostgREST y los comodines (como en Personal, M2). */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,().:"*%\\]/g, ' ').trim();
}

/**
 * GET /trainings
 * PERMISOS: Gerente (todas), Capacitador (las propias) — RLS: trainings_select_gerente / _capacitador_own.
 *   Decisión pendiente #5 resuelta en 0014: el Capacitador ve solo las propias.
 * REGLA DE NEGOCIO: actuales e históricas, filtrando por tema, fecha y capacitador. Paginación de PAGE_SIZE (25).
 * Errores: 400 si los filtros son inválidos.
 */
export async function listTrainings(filters: TrainingFilters): Promise<Paginated<TrainingListItem>> {
  const parsed = trainingFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Filtros inválidos', parsed.error.issues);
  const f = parsed.data;

  let query = supabase.from('trainings').select(LIST_COLUMNS, { count: 'exact' });
  if (f.topicId) query = query.eq('topic_id', f.topicId);
  if (f.fechaDesde) query = query.gte('fecha_dictado', f.fechaDesde);
  if (f.fechaHasta) query = query.lte('fecha_dictado', f.fechaHasta);
  if (f.capacitadorId) query = query.eq('capacitador_id', f.capacitadorId);
  if (f.estado) query = query.eq('estado', f.estado);
  // Lo más reciente primero; desempate por nro de registro (único) para que la paginación sea estable.
  query = query.order('fecha_dictado', { ascending: false }).order('numero_registro', { ascending: false });

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  // PGRST103: página fuera de rango → lista vacía en vez de error.
  if (error && error.code !== 'PGRST103') throw fromPostgrestError(error, ERRORS);

  return {
    data: ((data ?? []) as unknown as ListRow[]).map((r) => ({
      ...toTraining(r),
      cantidadAsistentes: r.training_attendees[0]?.count ?? 0,
    })),
    page: f.page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
  };
}

/**
 * GET /trainings/{id}
 * PERMISOS: Gerente, Capacitador (las propias) — RLS.
 * No está en la spec, pero hace falta para ver el detalle y editar (decisiones-pendientes.md #14).
 * Errores: 404.
 */
export async function getTraining(id: UUID): Promise<TrainingDetail> {
  const { data, error } = await supabase.from('trainings').select(DETAIL_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw fromPostgrestError(error, ERRORS);
  if (!data) throw new ApiError(404, 'La capacitación no existe');
  const r = data as unknown as DetailRow;
  return {
    ...toTraining(r),
    asistentes: r.training_attendees
      .map((a) => ({
        personId: a.person_id,
        dni: a.personnel?.dni ?? '',
        nombre: a.personnel?.nombre ?? '',
        apellido: a.personnel?.apellido ?? '',
        resultado: a.resultado,
        puestoIdAlDictar: a.puesto_id_snapshot,
        puestoNombreAlDictar: a.positions?.nombre ?? null,
        aplicabilidad: a.correspondencia,
      }))
      .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es')),
  };
}

/**
 * POST /trainings
 * PERMISOS: Capacitador; el Gerente solo como capacitador de la propia (RPC create_training, 0019).
 * REGLA DE NEGOCIO: Nro de registro correlativo automático, nunca se reutiliza.
 * REGLA DE NEGOCIO: Marcar por persona si el tema era obligatorio / electivo / no correspondía (lo hace el servidor).
 * REGLA DE NEGOCIO: Personas inactivas no se pueden incorporar.
 * Errores: 400 si falta el tema, la fecha es inválida o futura, el tema está inactivo o no hay asistentes.
 * Devuelve la capacitación con su número de registro asignado.
 */
export async function createTraining(input: TrainingInput): Promise<TrainingDetail> {
  const { data, error } = await supabase.rpc('create_training', toRpcArgs(input));
  if (error) throw fromRpcError(error);
  return getTraining(data as string);
}

/**
 * PUT /trainings/{id}
 * PERMISOS: solo quien la cargó, activa y sin certificados (RPC update_training, 0019). El Gerente no edita ajenas.
 * REGLA DE NEGOCIO: Solo mientras no tenga certificado generado.
 * Errores: 400; 403 si no es propia; 404; 409 si ya tiene certificados o está anulada.
 */
export async function updateTraining(id: UUID, input: TrainingInput): Promise<TrainingDetail> {
  const { error } = await supabase.rpc('update_training', { p_id: id, ...toRpcArgs(input) });
  if (error) throw fromRpcError(error);
  return getTraining(id);
}

/**
 * POST /trainings/{id}/void
 * PERMISOS: Capacitador (la propia) o Gerente (cualquiera) — RPC void_training, 0019.
 * REGLA DE NEGOCIO: Nunca se borra físicamente; el nro de registro queda anulado y no se reutiliza.
 * Errores: 404; 409 si ya tiene certificados (corregir con una capacitación nueva) o ya está anulada.
 */
export async function voidTraining(id: UUID): Promise<void> {
  const { error } = await supabase.rpc('void_training', { p_id: id });
  if (error) throw fromRpcError(error);
}

/**
 * Temas para el formulario y los filtros, con tipo y puestos (para anticipar la correspondencia en pantalla).
 * PERMISOS: Gerente, Capacitador (RLS de 0012). No está en la spec: hace falta para el formulario.
 */
export async function listTopicOptions(): Promise<TopicOption[]> {
  const { data, error } = await supabase
    .from('training_topics')
    .select('id, nombre, tipo, activo, training_topic_positions(position_id)')
    .order('nombre');
  if (error) throw fromPostgrestError(error, ERRORS);
  const rows = (data ?? []) as unknown as {
    id: string;
    nombre: string;
    tipo: TopicType;
    activo: boolean;
    training_topic_positions: { position_id: string }[];
  }[];
  return rows.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    tipo: t.tipo,
    activo: t.activo,
    puestoIds: t.training_topic_positions.map((p) => p.position_id),
  }));
}

/**
 * Búsqueda de personas ACTIVAS para el selector de asistentes (por nombre, apellido o DNI, y por puesto).
 * PERMISOS: Gerente, Capacitador (RLS personnel_select). Se limita a 30 resultados: hay que buscar.
 * No usa listPersonnel (M2) porque acá hace falta el nombre del puesto y buscar también por DNI.
 */
export async function searchPersonnel(opts: { q?: string; puestoId?: UUID }): Promise<PersonOption[]> {
  let query = supabase
    .from('personnel')
    .select('id, dni, nombre, apellido, position_id, positions(nombre)')
    .eq('activo', true);

  const words = sanitizeSearchTerm(opts.q ?? '').split(/\s+/).filter(Boolean).slice(0, 5);
  for (const w of words) {
    query = /^\d+$/.test(w)
      ? query.like('dni', `${w}%`)
      : query.or(`nombre.ilike.*${w}*,apellido.ilike.*${w}*`);
  }
  if (opts.puestoId) query = query.eq('position_id', opts.puestoId);

  const { data, error } = await query.order('apellido').order('nombre').limit(30);
  if (error) throw fromPostgrestError(error, ERRORS);
  const rows = (data ?? []) as unknown as {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    position_id: string;
    positions: { nombre: string } | null;
  }[];
  return rows.map((p) => ({
    id: p.id,
    dni: p.dni,
    nombre: p.nombre,
    apellido: p.apellido,
    puestoId: p.position_id,
    puestoNombre: p.positions?.nombre ?? null,
  }));
}

/**
 * Usuarios que pueden haber dictado (Gerente y Capacitadores), para el filtro del Gerente.
 * PERMISOS: el Gerente ve todos los perfiles (RLS profiles_select); el Capacitador solo el suyo (no usa el filtro).
 */
export async function listTrainers(): Promise<{ id: UUID; nombre: string }[]> {
  const { data, error } = await supabase.from('profiles').select('id, nombre').order('nombre');
  if (error) throw fromPostgrestError(error, ERRORS);
  return data ?? [];
}
