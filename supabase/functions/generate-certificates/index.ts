/**
 * generate-certificates — "Cierra" una capacitación y genera los PDFs de certificado.
 * Módulo: M7 · Certificados (spec §7)
 *
 * POST JSON { trainingId: uuid }
 * Respuesta: { generados: number }
 * Errores: 400 sin asistentes aprobados · 401 · 403 · 404 no existe (o es de otro capacitador) · 405 ·
 *   409 anulada o ya cerrada.
 *
 * Qué hace:
 *  1. Valida permisos y estado de la capacitación.
 *  2. Genera un PDF por asistente APROBADO (pdf-lib, ver docs/decisiones-tecnicas.md): nombre y DNI, tema, fecha,
 *     nro de registro, capacitador y encabezado Deca/Nexoris.
 *  3. Sube cada PDF al bucket privado 'certificados-pdf' con un nombre único (nunca sobrescribe).
 *  4. Registra los certificados y marca la capacitación como cerrada en UNA transacción (RPC finalize_certificates,
 *     0020). Si eso falla, borra los PDF recién subidos (no quedaron registrados en ningún lado).
 *
 * PERMISOS: Gerente (cualquiera) y Capacitador (solo las propias).
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): el cierre es explícito (botón "Cerrar y generar certificados").
 * REGLA DE NEGOCIO: el PDF es inmutable; NUNCA sobrescribir un archivo existente (auditoría YPF).
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): por ahora el encabezado es solo texto (sin logo).
 *   TODO(M7): sumar el logo (PNG) cuando lo tengan.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';
import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, conflict, errorToResponse, jsonResponse, notFound } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';

const FN = 'generate-certificates';
const BUCKET = 'certificados-pdf';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TrainingRow {
  id: string;
  numero_registro: number;
  fecha_dictado: string;
  duracion_real: number;
  capacitador_id: string;
  estado: 'activa' | 'anulada';
  tiene_certificados: boolean;
  training_topics: { nombre: string } | null;
  profiles: { nombre: string } | null;
  training_attendees: {
    id: string;
    resultado: 'aprobado' | 'no_aprobado';
    personnel: { dni: string; nombre: string; apellido: string } | null;
  }[];
}

interface CertData {
  nombreCompleto: string;
  dni: string;
  tema: string;
  fecha: string;
  duracion: number;
  capacitador: string;
  nroRegistro: number;
  emitido: string;
}

/** AAAA-MM-DD → DD/MM/AAAA. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** 30123456 → 30.123.456 */
function formatDni(dni: string): string {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Las fuentes estándar de pdf-lib solo cubren WinAnsi (incluye á, é, ñ, ü…). Un carácter fuera de eso haría fallar
 * el PDF: se le saca el acento y, si aun así no entra, se reemplaza por '?'.
 */
function winAnsiSafe(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 256) return ch;
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return base.length === 1 && (base.codePointAt(0) ?? 0) < 256 ? base : '?';
    })
    .join('');
}

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = rgb(0.1, 0.1, 0.1)) {
  const safe = winAnsiSafe(text);
  const width = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: (page.getWidth() - width) / 2, y, size, font, color });
}

async function buildPdf(c: CertData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(winAnsiSafe(`Certificado ${c.nroRegistro} - ${c.nombreCompleto}`));
  doc.setAuthor('Deca Electromecánica · Nexoris');
  // A4 apaisado.
  const page = doc.addPage([841.89, 595.28]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const gris = rgb(0.4, 0.4, 0.4);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 2 });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });

  drawCentered(page, 'DECA ELECTROMECÁNICA · NEXORIS', height - 90, bold, 16, gris);
  drawCentered(page, 'CERTIFICADO DE CAPACITACIÓN', height - 150, bold, 30);
  drawCentered(page, 'Se certifica que', height - 205, regular, 14, gris);
  drawCentered(page, c.nombreCompleto, height - 245, bold, 26);
  drawCentered(page, `DNI ${formatDni(c.dni)}`, height - 272, regular, 13, gris);
  drawCentered(page, 'aprobó la capacitación', height - 312, regular, 14, gris);
  drawCentered(page, c.tema, height - 350, bold, 20);
  drawCentered(
    page,
    `dictada el ${formatDate(c.fecha)}, con una duración de ${c.duracion.toLocaleString('es-AR')} h.`,
    height - 380,
    regular,
    13,
  );

  // Pie: capacitador a la izquierda, nro de registro a la derecha.
  page.drawText(winAnsiSafe(`Capacitador: ${c.capacitador}`), { x: 70, y: 80, size: 11, font: regular });
  const nro = `Nro. de registro: ${c.nroRegistro}`;
  page.drawText(nro, { x: width - 70 - bold.widthOfTextAtSize(nro, 11), y: 80, size: 11, font: bold });
  drawCentered(page, `Emitido el ${formatDate(c.emitido)}`, 58, regular, 9, gris);

  return await doc.save();
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const subidos: string[] = [];
  const admin = adminClient();
  try {
    const caller = await requireRole(req, ['gerente', 'capacitador']);
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    const body = await readJsonLimited(req, 1024);
    const trainingId = typeof body.trainingId === 'string' ? body.trainingId : '';
    if (!UUID_RE.test(trainingId)) throw badRequest('Capacitación inválida');

    // Con service role: los permisos se chequean acá abajo a mano.
    const { data, error } = await admin
      .from('trainings')
      .select(
        'id, numero_registro, fecha_dictado, duracion_real, capacitador_id, estado, tiene_certificados, ' +
          'training_topics(nombre), profiles(nombre), training_attendees(id, resultado, personnel(dni, nombre, apellido))',
      )
      .eq('id', trainingId)
      .maybeSingle();
    if (error) throw new HttpError(500, 'No se pudo leer la capacitación');
    const t = data as unknown as TrainingRow | null;

    // PERMISOS: el Capacitador solo sobre las propias (a una ajena responde como si no existiera).
    if (!t || (caller.rol === 'capacitador' && t.capacitador_id !== caller.id)) throw notFound('La capacitación no existe');
    if (t.estado === 'anulada') throw conflict('La capacitación está anulada: no se generan certificados');
    if (t.tiene_certificados) throw conflict('La capacitación ya tiene certificados generados');

    const aprobados = t.training_attendees.filter((a) => a.resultado === 'aprobado' && a.personnel);
    if (aprobados.length === 0) throw badRequest('No hay asistentes aprobados: no hay certificados para generar');

    const emitido = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    const items: { attendee_id: string; storage_path: string }[] = [];
    for (const a of aprobados) {
      const p = a.personnel!;
      const pdf = await buildPdf({
        nombreCompleto: `${p.nombre} ${p.apellido}`,
        dni: p.dni,
        tema: t.training_topics?.nombre ?? 'Capacitación',
        fecha: t.fecha_dictado,
        duracion: Number(t.duracion_real),
        capacitador: t.profiles?.nombre ?? '—',
        nroRegistro: t.numero_registro,
        emitido,
      });
      // Nombre único por archivo: nunca se pisa un PDF existente (upsert: false además lo impide).
      const path = `${t.numero_registro}/${a.id}/${crypto.randomUUID()}.pdf`;
      const { error: upError } = await admin.storage
        .from(BUCKET)
        .upload(path, pdf, { contentType: 'application/pdf', upsert: false });
      if (upError) throw new HttpError(500, 'No se pudo guardar un certificado');
      subidos.push(path);
      items.push({ attendee_id: a.id, storage_path: path });
    }

    const { error: rpcError } = await admin.rpc('finalize_certificates', { p_training_id: t.id, p_items: items });
    if (rpcError) {
      if (rpcError.hint === '409') throw conflict(rpcError.message);
      if (rpcError.hint === '404') throw notFound(rpcError.message);
      throw new HttpError(500, 'No se pudieron registrar los certificados');
    }

    log(FN, 'info', 'certificados generados', { trainingId: t.id, generados: items.length, por: caller.id });
    return jsonResponse(200, { generados: items.length });
  } catch (err) {
    // Si algo falló después de subir PDFs, no quedaron registrados: se borran para no dejar archivos huérfanos.
    if (subidos.length > 0) {
      const { error: rmError } = await admin.storage.from(BUCKET).remove(subidos);
      if (rmError) log(FN, 'warn', 'no se pudieron borrar PDFs huérfanos', { paths: subidos });
    }
    log(FN, 'error', 'falló', { error: String(err) });
    return errorToResponse(err);
  }
});
