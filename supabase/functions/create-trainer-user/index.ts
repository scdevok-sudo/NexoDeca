/**
 * create-trainer-user — El Gerente crea cuentas de Capacitador.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Validar que quien llama es Gerente (requireRole).
 *  - Validar el body (email, nombre, contraseña inicial) y devolver 400 si es inválido.
 *  - Crear el usuario con la Admin API de Supabase Auth y su fila en profiles con rol 'capacitador'.
 *  - Devolver 409 si el email ya existe.
 *
 * PERMISOS: solo Gerente. No hay auto-registro.
 * REGLA DE NEGOCIO: un único rol por usuario. Contraseñas siempre por Supabase Auth, nunca hash a mano.
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { errorToResponse, jsonError } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireRole(req, ['gerente']);
    log('create-trainer-user', 'info', 'request recibido');
    // TODO(M1): implementar según el comentario de cabecera.
    return jsonError(501, 'Not implemented: create-trainer-user');
  } catch (err) {
    log('create-trainer-user', 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
