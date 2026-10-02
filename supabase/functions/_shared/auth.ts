/**
 * _shared/auth.ts — Validación del JWT y del rol en las Edge Functions.
 * Módulo: Setup (helper compartido) / M1 · Login y sesiones
 *
 * Qué tiene que hacer:
 *  - Leer el header Authorization, validar el JWT con Supabase y devolver el usuario + su rol (tabla profiles).
 *  - Sin token válido: 401 ANTES de evaluar cualquier otra regla (spec §API).
 *  - Rol no permitido: 403.
 *
 * PERMISOS: esta es la verificación real; ocultar botones en el frontend no es seguridad.
 */

import { forbidden, unauthorized } from './errors.ts';

export type Role = 'gerente' | 'capacitador';

export interface AuthedUser {
  id: string;
  email: string;
  rol: Role;
}

// TODO(SETUP): implementar con el cliente de Supabase (auth.getUser(jwt)) + lectura de profiles.rol.
export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get('Authorization');
  if (!header) throw unauthorized();
  throw new Error('Not implemented: requireUser');
}

/** Exige sesión válida y que el rol esté entre los permitidos. */
export async function requireRole(req: Request, roles: Role[]): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!roles.includes(user.rol)) throw forbidden();
  return user;
}
