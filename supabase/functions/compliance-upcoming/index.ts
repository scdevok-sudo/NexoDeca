/**
 * compliance-upcoming — Calcula capacitaciones vencidas o próximas a vencer.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8, GET /compliance/upcoming)
 *
 * Qué tiene que hacer:
 *  - Para cada persona activa y cada tema OBLIGATORIO activo que le corresponde según su puesto:
 *    tomar la fecha del último curso aprobado y sumarle la periodicidad (meses) del tema.
 *  - Devolver vencidas y las que vencen dentro del rango de días (default 15), filtrables por puesto y tema.
 *  - Temas sin periodicidad (no vencen) quedan afuera.
 *
 * PERMISOS: Gerente y Capacitador.
 * REGLA DE NEGOCIO: NO envía emails ni notificaciones: es un panel (avisar al empleado es manual).
 * TODO(M8): definir qué pasa con quien nunca tomó el curso. TODO(consultar a Santi).
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { errorToResponse, jsonError } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireRole(req, ['gerente', 'capacitador']);
    log('compliance-upcoming', 'info', 'request recibido');
    // TODO(M8): implementar según el comentario de cabecera.
    return jsonError(501, 'Not implemented: compliance-upcoming');
  } catch (err) {
    log('compliance-upcoming', 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
