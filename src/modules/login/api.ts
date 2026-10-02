/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { AuthUser, LoginInput, CreateTrainerInput } from './types';

/**
 * POST /auth/login
 * PERMISOS: público
 * TODO(M1): Usar supabase.auth.signInWithPassword y luego leer el perfil (rol).
 * TODO(M1): Errores: 400 datos inválidos, 401 credenciales incorrectas.
 */
export async function login(input: LoginInput): Promise<AuthUser> {
  throw new Error('Not implemented: login');
}

/**
 * POST /auth/logout
 * PERMISOS: Gerente, Capacitador
 * TODO(M1): supabase.auth.signOut() y limpiar el cache de react-query.
 */
export async function logout(): Promise<void> {
  throw new Error('Not implemented: logout');
}

/**
 * GET /auth/me
 * PERMISOS: Gerente, Capacitador
 * TODO(M1): Devuelve nombre y rol del usuario autenticado (sale de la tabla profiles).
 */
export async function getMe(): Promise<AuthUser | null> {
  throw new Error('Not implemented: getMe');
}

/**
 * POST functions/create-trainer-user
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Solo el Gerente puede crear cuentas; se verifica en la Edge Function, no solo ocultando el botón.
 * TODO(M1): Invoca la Edge Function create-trainer-user (supabase.functions.invoke).
 * TODO(consultar a Santi): este endpoint no figura en la sección API de la spec, pero §1 pide que el Gerente cree cuentas de Capacitador.
 */
export async function createTrainerUser(input: CreateTrainerInput): Promise<AuthUser> {
  throw new Error('Not implemented: createTrainerUser');
}
