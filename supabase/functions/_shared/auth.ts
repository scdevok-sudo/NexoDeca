/**
 * _shared/auth.ts — Validación del JWT y del rol en las Edge Functions.
 * Módulo: Setup (helper compartido) / M1 · Login y sesiones
 *
 * - Sin token válido: 401 ANTES de evaluar cualquier otra regla (spec §API).
 * - Usuario sin perfil o rol no permitido: 403.
 * PERMISOS: esta es la verificación real; ocultar botones en el frontend no es seguridad.
 * REGLA DE NEGOCIO: el rol sale de la tabla profiles (nunca de user_metadata, que el usuario puede editar).
 */

import { HttpError, forbidden, unauthorized } from './errors.ts';
import { adminClient } from './supabase.ts';

export type Role = 'gerente' | 'capacitador';

export interface AuthedUser {
  id: string;
  email: string;
  rol: Role;
  /** JWT del usuario, para crear un userClient (RLS) dentro de la función. */
  jwt: string;
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get('Authorization') ?? '');
  if (!match) throw unauthorized();
  const jwt = match[1];

  const admin = adminClient();
  // getUser valida el token contra Supabase Auth (firma, vencimiento y que la sesión no esté revocada).
  // La anon key también es un JWT: acá falla porque no corresponde a ningún usuario → 401.
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) throw unauthorized('Sesión inválida o vencida');

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('rol')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) throw new HttpError(500, 'No se pudo verificar el rol');
  const rol = profile?.rol;
  if (rol !== 'gerente' && rol !== 'capacitador') throw forbidden('Tu usuario no tiene un rol asignado');

  return { id: data.user.id, email: data.user.email ?? '', rol, jwt };
}

/** Exige sesión válida y que el rol esté entre los permitidos. */
export async function requireRole(req: Request, roles: Role[]): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!roles.includes(user.rol)) throw forbidden();
  return user;
}
