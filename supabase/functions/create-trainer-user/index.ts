/**
 * create-trainer-user — El Gerente crea cuentas de Capacitador.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * POST { email, nombre, password } → 201 { id, email, nombre, rol: 'capacitador' }
 * Errores: 400 body inválido · 401 sin sesión · 403 no es Gerente · 405 método · 409 email ya registrado.
 *
 * PERMISOS: solo Gerente. No hay auto-registro.
 * REGLA DE NEGOCIO: un único rol por usuario, y acá SIEMPRE es 'capacitador' (no se toma del body).
 * REGLA DE NEGOCIO: contraseñas siempre por Supabase Auth, nunca hash a mano. Nunca se loguean.
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, conflict, errorToResponse, jsonResponse } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';
import { normalizeEmail, normalizeName } from '../_shared/validation.ts';

const FN = 'create-trainer-user';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    // 401/403 antes que cualquier otra validación (spec §API).
    const caller = await requireRole(req, ['gerente']);
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    const body = await readJsonLimited(req, 8 * 1024);
    const email = normalizeEmail(body.email);
    const nombre = typeof body.nombre === 'string' ? normalizeName(body.nombre, 100) : null;
    const password = typeof body.password === 'string' ? body.password : '';
    const fields: Record<string, string> = {};
    if (!email) fields.email = 'Email inválido';
    if (!nombre) fields.nombre = 'Nombre inválido';
    // 72: límite de bcrypt en Supabase Auth. TODO(consultar a Santi): política de contraseña definitiva.
    if (password.length < 8 || password.length > 72) fields.password = 'Entre 8 y 72 caracteres';
    if (!email || !nombre || fields.password) throw badRequest('Datos inválidos', fields);

    const admin = adminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      // El Gerente la crea a mano: no hace falta confirmar el email (no hay mails automáticos en Fase 1).
      email_confirm: true,
    });
    if (error || !data.user) {
      if (error?.code === 'email_exists' || error?.status === 422) throw conflict('Ya existe una cuenta con ese email');
      if (error?.code === 'weak_password') throw badRequest('La contraseña es demasiado débil');
      throw new HttpError(500, 'No se pudo crear la cuenta');
    }

    const userId = data.user.id;
    const { error: profileError } = await admin.from('profiles').insert({ id: userId, nombre, rol: 'capacitador' });
    if (profileError) {
      // Rollback: no dejar una cuenta de Auth sin perfil/rol.
      await admin.auth.admin.deleteUser(userId);
      log(FN, 'error', 'falló el alta del perfil, se revirtió el usuario', { code: profileError.code });
      throw new HttpError(500, 'No se pudo crear la cuenta');
    }

    // Sin email ni contraseña en los logs: solo ids.
    log(FN, 'info', 'capacitador creado', { by: caller.id, userId });
    return jsonResponse(201, { id: userId, email, nombre, rol: 'capacitador' });
  } catch (err) {
    if (!(err instanceof HttpError)) log(FN, 'error', 'error inesperado', { error: String(err) });
    return errorToResponse(err);
  }
});
