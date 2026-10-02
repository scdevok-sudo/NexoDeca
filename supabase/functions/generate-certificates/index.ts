/**
 * generate-certificates — Genera los PDFs de certificado al cerrar una capacitación.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Recibir el id de la capacitación; validar que existe (404) y que no está anulada.
 *  - Generar un PDF por cada asistente con resultado 'aprobado': nombre y DNI, tema, fecha,
 *    nro de registro, capacitador y encabezado Deca/Nexoris.
 *  - Guardar cada PDF en el bucket privado 'certificates' y registrar la fila en certificates.
 *  - Si ya existía un certificado: crear una versión nueva vigente y dejar la vieja de histórico.
 *
 * PERMISOS: Gerente y Capacitador (el capacitador solo sobre sus capacitaciones).
 * REGLA DE NEGOCIO: el PDF es inmutable; NUNCA sobrescribir un archivo existente (auditoría YPF).
 * DECISIÓN PENDIENTE: pdf-lib vs. HTML→PDF. No se eligió librería; documentarlo en el README del módulo.
 * TODO(consultar a Santi): la spec dice "al cerrar la capacitación" pero no define cómo se cierra ni qué dispara esta función.
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
    log('generate-certificates', 'info', 'request recibido');
    // TODO(M7): implementar según el comentario de cabecera.
    return jsonError(501, 'Not implemented: generate-certificates');
  } catch (err) {
    log('generate-certificates', 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
