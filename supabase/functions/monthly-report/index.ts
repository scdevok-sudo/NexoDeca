/**
 * monthly-report — Genera y guarda el reporte mensual para YPF.
 * Módulo: M9 · Reporte mensual YPF (spec §9, GET /reports/monthly/{year}/{month})
 *
 * Qué tiene que hacer:
 *  - Recibir año y mes (400 si son inválidos).
 *  - Juntar las capacitaciones del mes (tema, fecha, nro de registro, capacitador) y la nómina de participantes con resultado.
 *  - Generar el archivo (PDF o Excel, a definir con Juan), guardarlo en el bucket privado 'reports'
 *    y registrar la fila en monthly_reports.
 *  - Devolver el reporte con su link de descarga.
 *
 * PERMISOS: Gerente y Capacitador.
 * REGLA DE NEGOCIO: puede generarse con el mes en curso incompleto.
 * REGLA DE NEGOCIO: el reporte queda guardado como archivo histórico (no se regenera al vuelo).
 * DECISIÓN PENDIENTE: PDF vs. Excel (con Juan) y librería. No se eligió ninguna.
 * TODO(consultar a Santi): ¿las capacitaciones anuladas entran en el reporte?
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
    log('monthly-report', 'info', 'request recibido');
    // TODO(M9): implementar según el comentario de cabecera.
    return jsonError(501, 'Not implemented: monthly-report');
  } catch (err) {
    log('monthly-report', 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
