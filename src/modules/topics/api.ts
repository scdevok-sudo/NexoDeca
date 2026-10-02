/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { TrainingTopic, TopicFilters, TopicInput } from './types';

/**
 * GET /training-topics
 * PERMISOS: Gerente, Capacitador
 * TODO(M4): Filtros por nombre, tipo, puesto; paginación de 25.
 */
export async function listTopics(filters: TopicFilters): Promise<Paginated<TrainingTopic>> {
  throw new Error('Not implemented: listTopics');
}

/**
 * POST /training-topics
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Nombre único; solo puestos activos.
 * TODO(M4): Errores: 400; 409 nombre duplicado.
 */
export async function createTopic(input: TopicInput): Promise<TrainingTopic> {
  throw new Error('Not implemented: createTopic');
}

/**
 * PUT /training-topics/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Cambiar puestos no afecta capacitaciones ya dictadas.
 * TODO(M4): Errores: 400; 404; 409 nombre duplicado.
 */
export async function updateTopic(id: UUID, input: TopicInput): Promise<TrainingTopic> {
  throw new Error('Not implemented: updateTopic');
}

/**
 * DELETE /training-topics/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Al desactivar no se altera lo ya dictado con ese tema.
 * TODO(M4): Errores: 404.
 */
export async function deactivateTopic(id: UUID): Promise<void> {
  throw new Error('Not implemented: deactivateTopic');
}
