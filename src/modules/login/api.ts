/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 * REGLA DE NEGOCIO: el rol sale SIEMPRE de la tabla profiles (nunca de user_metadata, que el usuario puede editar).
 */

import { supabase } from '../../lib/supabase';
import { queryClient } from '../../lib/queryClient';
import { ApiError, fromFunctionsError } from '../../lib/apiError';
import type { Role } from '../../types/common';
import type { AuthUser, LoginInput, CreateTrainerInput } from './types';
import { createTrainerSchema, loginSchema } from './schemas';

interface ProfileRow {
  nombre: string;
  rol: Role;
}

/**
 * Lee el perfil (nombre + rol) del usuario. Devuelve null si no tiene perfil o el rol no es válido.
 * PERMISOS: RLS de profiles deja leer el propio perfil.
 */
export async function fetchProfile(userId: string, email: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.from('profiles').select('nombre, rol').eq('id', userId).maybeSingle();
  if (error) throw new ApiError(500, 'No se pudo cargar el perfil');
  const row = data as ProfileRow | null;
  if (!row || (row.rol !== 'gerente' && row.rol !== 'capacitador')) return null;
  return { id: userId, email, nombre: row.nombre, rol: row.rol };
}

/**
 * POST /auth/login
 * PERMISOS: público
 * Errores: 400 datos inválidos · 401 credenciales incorrectas · 403 usuario sin rol · 429 demasiados intentos.
 */
export async function login(input: LoginInput): Promise<AuthUser> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Email o contraseña inválidos');

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) throw new ApiError(429, 'Demasiados intentos. Esperá unos minutos.');
    // Mensaje genérico: no revela si el email existe.
    throw new ApiError(401, 'Email o contraseña incorrectos');
  }

  const user = await fetchProfile(data.user.id, data.user.email ?? parsed.data.email);
  if (!user) {
    // Cuenta de Auth sin perfil/rol: no se le deja entrar.
    await supabase.auth.signOut();
    throw new ApiError(403, 'Tu usuario no tiene un rol asignado. Consultá con el Gerente.');
  }
  return user;
}

/**
 * POST /auth/logout
 * PERMISOS: Gerente, Capacitador
 * Limpia el cache de react-query para que el próximo usuario no vea datos del anterior.
 * Si falla la revocación en el servidor (sin red), igual borra la sesión local para no dejar el token guardado.
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) await supabase.auth.signOut({ scope: 'local' });
  queryClient.clear();
}

/**
 * GET /auth/me
 * PERMISOS: Gerente, Capacitador
 * getUser() valida el token contra Supabase Auth (getSession() solo lee el storage local).
 */
export async function getMe(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return fetchProfile(data.user.id, data.user.email ?? '');
}

/**
 * POST functions/create-trainer-user
 * PERMISOS: Gerente (lo verifica la Edge Function, no este código).
 * Errores: 400 · 401 · 403 · 409 email ya registrado.
 * TODO(consultar a Santi): este endpoint no figura en la sección API de la spec, pero §1 pide que el Gerente cree cuentas.
 */
export async function createTrainerUser(input: CreateTrainerInput): Promise<AuthUser> {
  const parsed = createTrainerSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Datos inválidos');

  const { data, error } = await supabase.functions.invoke<AuthUser>('create-trainer-user', { body: parsed.data });
  if (error) throw await fromFunctionsError(error);
  if (!data) throw new ApiError(500, 'Respuesta vacía del servidor');
  return data;
}
