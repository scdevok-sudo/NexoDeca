/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import { supabase } from '../../lib/supabase';
import { ApiError, fromPostgrestError } from '../../lib/apiError';
import type { UUID } from '../../types/common';
import type { ComplianceFilters, ComplianceItem, ComplianceStatus } from './types';
import { DEFAULT_DIAS, complianceFiltersSchema } from './schemas';

interface Row {
  person_id: string;
  dni: string;
  nombre: string;
  apellido: string;
  puesto_nombre: string;
  topic_id: string;
  tema_nombre: string;
  periodicidad_meses: number;
  ultimo_aprobado: string | null;
  vence_el: string | null;
  estado: ComplianceStatus;
  dias_restantes: number | null;
}

const ERRORS = {
  '42501': 'No tenés permiso para ver los vencimientos',
};

/**
 * GET /compliance/upcoming → RPC compliance_upcoming (0021). Se resolvió en la base y no en una Edge Function
 *   (decidido con Lucas, 2026-10-17).
 * PERMISOS: Gerente, Capacitador (lo verifica la RPC).
 * REGLA DE NEGOCIO: Calculado desde la fecha del último curso aprobado por persona y tema, más la periodicidad del
 *   tema. Incluye vencidas, por vencer dentro de `dias` (default 15) y quienes nunca lo aprobaron.
 * Errores: 400 si los filtros son inválidos.
 */
export async function getUpcomingCompliance(filters: ComplianceFilters): Promise<ComplianceItem[]> {
  const parsed = complianceFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Filtros inválidos');
  const f = parsed.data;

  const { data, error } = await supabase.rpc('compliance_upcoming', {
    p_dias: f.dias ?? DEFAULT_DIAS,
    p_position_id: f.puestoId ?? null,
    p_topic_id: f.topicId ?? null,
  });
  if (error) throw fromPostgrestError(error, ERRORS);

  return ((data ?? []) as Row[]).map((r) => ({
    personId: r.person_id,
    dni: r.dni,
    personaNombre: `${r.apellido}, ${r.nombre}`,
    puestoNombre: r.puesto_nombre,
    topicId: r.topic_id,
    temaNombre: r.tema_nombre,
    periodicidadMeses: r.periodicidad_meses,
    ultimoAprobado: r.ultimo_aprobado,
    venceEl: r.vence_el,
    estado: r.estado,
    diasRestantes: r.dias_restantes,
  }));
}

/**
 * Temas que pueden vencer (obligatorios, activos, con periodicidad), para el filtro del panel.
 * PERMISOS: Gerente, Capacitador (RLS de 0012). No está en la spec: hace falta para el filtro.
 */
export async function listExpiringTopics(): Promise<{ id: UUID; nombre: string }[]> {
  const { data, error } = await supabase
    .from('training_topics')
    .select('id, nombre')
    .eq('activo', true)
    .eq('tipo', 'obligatorio')
    .not('periodicidad_meses', 'is', null)
    .order('nombre');
  if (error) throw fromPostgrestError(error, ERRORS);
  return data ?? [];
}
