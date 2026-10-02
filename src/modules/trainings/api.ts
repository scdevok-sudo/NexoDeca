/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { TrainingAttendee, Training, TrainingFilters, TrainingInput } from './types';

/**
 * GET /trainings
 * PERMISOS: Gerente (todas), Capacitador (las propias)
 * TODO(consultar a Santi): ¿el Capacitador ve solo las propias o todas? Decisión pendiente (ver docs/decisiones-pendientes.md).
 * TODO(M6): Filtros por tema, fecha, capacitador; paginación.
 */
export async function listTrainings(filters: TrainingFilters): Promise<Paginated<Training>> {
  throw new Error('Not implemented: listTrainings');
}

/**
 * GET /trainings/{id}
 * PERMISOS: Gerente, Capacitador
 * TODO(consultar a Santi): este endpoint no figura en la spec, pero hace falta para editar/ver el detalle.
 */
export async function getTraining(id: UUID): Promise<Training> {
  throw new Error('Not implemented: getTraining');
}

/**
 * POST /trainings
 * PERMISOS: Capacitador
 * REGLA DE NEGOCIO: Nro de registro correlativo automático, nunca se reutiliza.
 * REGLA DE NEGOCIO: Marcar por persona si el tema era obligatorio / electivo / no correspondía.
 * REGLA DE NEGOCIO: Personas inactivas no se pueden incorporar.
 * TODO(M6): Errores: 400 si falta el tema o la fecha es inválida.
 * TODO(M6): Devuelve la capacitación con su número de registro asignado.
 */
export async function createTraining(input: TrainingInput): Promise<Training> {
  throw new Error('Not implemented: createTraining');
}

/**
 * PUT /trainings/{id}
 * PERMISOS: Capacitador (solo las propias y sin certificados)
 * REGLA DE NEGOCIO: Solo mientras no tenga certificado generado.
 * TODO(M6): Errores: 404; 409 si ya tiene certificados generados.
 */
export async function updateTraining(id: UUID, input: TrainingInput): Promise<Training> {
  throw new Error('Not implemented: updateTraining');
}

/**
 * POST /trainings/{id}/void
 * PERMISOS: Capacitador (la propia) o Gerente
 * REGLA DE NEGOCIO: Nunca se borra físicamente; el nro de registro queda anulado y no se reutiliza.
 * TODO(M6): Errores: 404; 409 si ya tiene certificados (corregir con una capacitación nueva).
 */
export async function voidTraining(id: UUID): Promise<Training> {
  throw new Error('Not implemented: voidTraining');
}
