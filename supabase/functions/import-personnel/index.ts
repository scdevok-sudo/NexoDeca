/**
 * import-personnel — Importación masiva de personal por CSV.
 * Módulo: M2 · Gestión de Personal (spec §2, POST /personnel/import)
 *
 * Qué tiene que hacer:
 *  - Validar que quien llama es Gerente.
 *  - Recibir el CSV, parsearlo y validar fila por fila (DNI, nombre, apellido, puesto existente y activo, fecha de ingreso).
 *  - Insertar las filas válidas y rechazar las inválidas (DNI duplicado, puesto inexistente, formato).
 *  - Responder { procesados, importados, rechazados: [{ fila, motivo }] }.
 *  - 400 si el archivo no respeta el formato esperado.
 *
 * PERMISOS: solo Gerente.
 * REGLA DE NEGOCIO: informar procesados, importados y rechazados, con el motivo de cada rechazo.
 * TODO(M2): definir el formato exacto del CSV (columnas, separador, codificación). TODO(consultar a Santi).
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
    log('import-personnel', 'info', 'request recibido');
    // TODO(M2): implementar según el comentario de cabecera.
    return jsonError(501, 'Not implemented: import-personnel');
  } catch (err) {
    log('import-personnel', 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
