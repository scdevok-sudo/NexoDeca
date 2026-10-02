/**
 * certificates-by-dni — Consulta PÚBLICA (sin login) de los certificados de una persona por DNI.
 * Módulo: M7 · Certificados (spec §7, GET /certificates/by-dni/{dni})
 *
 * ⚠️ Es el punto más sensible de privacidad de todo el sistema.
 *
 * Qué tiene que hacer:
 *  - Recibir ÚNICAMENTE un DNI exacto y validar su formato (400 si es inválido).
 *  - Devolver solo los certificados de esa persona, con un link de descarga (URL firmada de vida corta).
 *  - Responder IGUAL si el DNI no existe o no tiene certificados (misma forma y mismo status),
 *    para no confirmar ni negar la existencia de una persona. La spec habla de 404 en ambos casos.
 *
 * PERMISOS: público (esta función tiene verify_jwt = false en config.toml). Usa service role por dentro.
 * REGLA DE NEGOCIO: NUNCA listados, NUNCA búsqueda parcial ni por nombre. Nada de datos de otras personas.
 * TODO(M7): rate limiting / protección contra enumeración de DNIs (la spec no lo pide; consultar a Santi).
 * TODO(M7): no loguear el DNI completo.
 */

import { handleCors } from '../_shared/cors.ts';
import { errorToResponse, jsonError } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    // Sin requireRole a propósito: es pública.
    log('certificates-by-dni', 'info', 'request recibido');
    // TODO(M7): implementar según el comentario de cabecera.
    return jsonError(501, 'Not implemented: certificates-by-dni');
  } catch (err) {
    log('certificates-by-dni', 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
