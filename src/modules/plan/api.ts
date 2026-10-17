/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import { supabase } from '../../lib/supabase';
import { ApiError, fromPostgrestError } from '../../lib/apiError';
import type { UUID } from '../../types/common';
import type {
  CopyPlanResult,
  ExpectedAttendee,
  PlanInput,
  PlanMonth,
  PlanTopic,
  TrainingPlan,
} from './types';
import { planSchema, planYearSchema } from './schemas';

const PLAN_COLUMNS = 'id, anio, items:training_plan_items(id, mes, topic_id, training_topics(nombre, activo))';

interface PlanRow {
  id: string;
  anio: number;
  items: {
    id: string;
    mes: number;
    topic_id: string;
    training_topics: { nombre: string; activo: boolean } | null;
  }[];
}

const ERRORS = {
  '23505': 'Ese año ya tiene plan',
  '23503': 'Alguno de los temas no existe',
  '23514': 'Hay datos con formato inválido',
  '42501': 'No tenés permiso para modificar el plan',
};

const MESES: PlanMonth[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function parseYear(year: number): number {
  const parsed = planYearSchema.safeParse(year);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Año inválido');
  return parsed.data;
}

function toPlan(r: PlanRow): TrainingPlan {
  return {
    year: r.anio,
    meses: MESES.map((mes) => ({
      mes,
      topics: r.items
        .filter((i) => i.mes === mes)
        .map(
          (i): PlanTopic => ({
            id: i.topic_id,
            nombre: i.training_topics?.nombre ?? 'Tema desconocido',
            activo: i.training_topics?.activo ?? false,
          }),
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    })),
  };
}

async function fetchPlanRow(year: number): Promise<PlanRow | null> {
  const { data, error } = await supabase.from('training_plans').select(PLAN_COLUMNS).eq('anio', year).maybeSingle();
  if (error) throw fromPostgrestError(error, ERRORS);
  return data as unknown as PlanRow | null;
}

async function insertItems(planId: string, items: { mes: number; topic_id: string }[]) {
  if (items.length === 0) return;
  const { error } = await supabase.from('training_plan_items').insert(items.map((i) => ({ plan_id: planId, ...i })));
  if (error) throw fromPostgrestError(error, ERRORS);
}

/**
 * GET /training-plans/{year}
 * PERMISOS: Gerente, Capacitador (RLS: training_plans_select, training_plan_items_select)
 * Devuelve null si ese año todavía no tiene plan.
 * Errores: 400 si el año es inválido.
 */
export async function getPlan(year: number): Promise<TrainingPlan | null> {
  const row = await fetchPlanRow(parseYear(year));
  return row ? toPlan(row) : null;
}

/**
 * PUT /training-plans/{year}
 * PERMISOS: Gerente (RLS: training_plans_insert, training_plan_items_insert/delete)
 * Crea el plan si no existe y deja cada mes con exactamente los temas indicados.
 * REGLA DE NEGOCIO: modificar un mes con capacitaciones dictadas no altera lo ya dictado: las capacitaciones (M6)
 *   no referencian al plan, así que sacar un tema del plan no toca nada de lo dictado.
 * REGLA DE NEGOCIO: solo se agregan temas activos (trigger de 0018 → 400). Un tema que ya estaba planificado y
 *   después se desactivó se puede dejar donde está.
 * Errores: 400 si algún tema no existe o está inactivo.
 */
export async function upsertPlan(year: number, input: PlanInput): Promise<TrainingPlan> {
  const anio = parseYear(year);
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Datos inválidos', parsed.error.issues);

  let row = await fetchPlanRow(anio);
  if (!row) {
    const { data, error } = await supabase.from('training_plans').insert({ anio }).select('id').single();
    if (error) throw fromPostgrestError(error, ERRORS);
    row = { id: data.id, anio, items: [] };
  }

  // Solo se toca lo que cambió (como en los puestos de un tema, M4): menos riesgo si algo falla a mitad de camino.
  const key = (mes: number, topicId: string) => `${mes}:${topicId}`;
  const deseados = new Map<string, { mes: number; topic_id: string }>();
  for (const m of parsed.data.meses) {
    for (const topicId of m.topicIds) deseados.set(key(m.mes, topicId), { mes: m.mes, topic_id: topicId });
  }
  const actuales = new Set(row.items.map((i) => key(i.mes, i.topic_id)));
  const quitar = row.items.filter((i) => !deseados.has(key(i.mes, i.topic_id))).map((i) => i.id);
  const agregar = [...deseados.entries()].filter(([k]) => !actuales.has(k)).map(([, v]) => v);

  // TODO(M5): no es atómico (borrar + insertar son dos llamadas). Para hacerlo atómico haría falta una RPC.
  //   TODO(consultar a Santi): mismo tema que en M4 (temas + puestos).
  if (quitar.length > 0) {
    const { error } = await supabase.from('training_plan_items').delete().in('id', quitar);
    if (error) throw fromPostgrestError(error, ERRORS);
  }
  await insertItems(row.id, agregar);

  return (await getPlan(anio)) as TrainingPlan;
}

/**
 * POST /training-plans/{year}/copy-from/{source_year}
 * PERMISOS: Gerente (RLS: training_plans_insert, training_plan_items_insert/delete)
 * REGLA DE NEGOCIO: el plan de otro año se usa como punto de partida: el año destino queda con los mismos temas
 *   en los mismos meses. El año de origen no se toca.
 * REGLA DE NEGOCIO: si el año destino ya tiene temas, se REEMPLAZAN, pero solo con `reemplazar: true` (el form
 *   pide confirmación). Decidido con Lucas el 2026-10-17.
 * REGLA DE NEGOCIO: los temas que hoy están inactivos no se copian (no se pueden planificar); se informan.
 * Errores: 400 si los años son inválidos o iguales; 404 si el año de origen no tiene plan;
 *   409 si el año destino ya tiene temas y no se pidió reemplazar.
 */
export async function copyPlan(
  year: number,
  sourceYear: number,
  opts: { reemplazar?: boolean } = {},
): Promise<CopyPlanResult> {
  const destino = parseYear(year);
  const origen = parseYear(sourceYear);
  if (destino === origen) throw new ApiError(400, 'El año de origen tiene que ser distinto al de destino');

  const source = await fetchPlanRow(origen);
  if (!source) throw new ApiError(404, `El año ${origen} no tiene plan para copiar`);
  const target = await fetchPlanRow(destino);
  if (target && target.items.length > 0 && !opts.reemplazar) {
    throw new ApiError(409, `El año ${destino} ya tiene temas planificados`);
  }

  const activos = source.items.filter((i) => i.training_topics?.activo);
  const omitidos = source.items.filter((i) => !i.training_topics?.activo);
  // upsertPlan crea el plan si no existe y deja cada mes exactamente con estos temas (reemplaza lo que hubiera).
  const plan = await upsertPlan(destino, {
    meses: MESES.map((mes) => ({ mes, topicIds: activos.filter((i) => i.mes === mes).map((i) => i.topic_id) })),
  });

  return {
    plan,
    temasOmitidos: [...new Set(omitidos.map((i) => i.training_topics?.nombre ?? 'Tema desconocido'))],
  };
}

/**
 * Temas activos del catálogo, para el selector del plan (sin paginar: es un catálogo chico).
 * PERMISOS: Gerente, Capacitador (RLS: training_topics_select)
 * No está en la spec: hace falta para armar el plan. Se lee la tabla de M4 directo (sin pasar por listTopics,
 * que pagina de a 25).
 */
export async function listActiveTopicOptions(): Promise<{ id: UUID; nombre: string }[]> {
  const { data, error } = await supabase.from('training_topics').select('id, nombre').eq('activo', true).order('nombre');
  if (error) throw fromPostgrestError(error, ERRORS);
  return data ?? [];
}

/**
 * Quién debería tomar un tema: personal ACTIVO cuyo puesto actual está entre los puestos del tema (M4 × M2).
 * PERMISOS: Gerente, Capacitador (RLS: training_topic_positions_select, personnel_select)
 * No está en la spec como endpoint (ver docs/decisiones-pendientes.md #12): se calcula en el cliente a pedido,
 *   para un tema por vez.
 */
export async function getExpectedAttendees(topicId: UUID): Promise<ExpectedAttendee[]> {
  const { data: puestos, error: pError } = await supabase
    .from('training_topic_positions')
    .select('position_id')
    .eq('topic_id', topicId);
  if (pError) throw fromPostgrestError(pError, ERRORS);
  const positionIds = (puestos ?? []).map((p) => p.position_id);
  if (positionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('personnel')
    .select('id, dni, nombre, apellido, positions(nombre)')
    .eq('activo', true)
    .in('position_id', positionIds)
    .order('apellido')
    .order('nombre');
  if (error) throw fromPostgrestError(error, ERRORS);

  const rows = (data ?? []) as unknown as {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    positions: { nombre: string } | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    dni: r.dni,
    nombre: r.nombre,
    apellido: r.apellido,
    puestoNombre: r.positions?.nombre ?? null,
  }));
}
