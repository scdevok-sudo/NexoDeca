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
 *  2. Genera un PDF por asistente APROBADO (pdf-lib, ver docs/decisiones-tecnicas.md): logo, nombre, DNI y puesto,
 *     tema, fecha, vigencia, nro de registro, capacitador, firma del Responsable de Seg. e Higiene (si está
 *     cargada) y un QR que lleva a /certificado/<id> (verificación pública, certificate-verify).
 *  3. Sube cada PDF al bucket privado 'certificados-pdf' con un nombre único (nunca sobrescribe).
 *  4. Registra los certificados y marca la capacitación como cerrada en UNA transacción (RPC finalize_certificates,
 *     0020/0024). Si eso falla, borra los PDF recién subidos (no quedaron registrados en ningún lado).
 *
 * PERMISOS: Gerente (cualquiera) y Capacitador (solo las propias).
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): el cierre es explícito (botón "Cerrar y generar certificados").
 * REGLA DE NEGOCIO: el PDF es inmutable; NUNCA sobrescribir un archivo existente (auditoría YPF).
 * REGLA DE NEGOCIO: no se inventan datos: sin legajo ni puntaje (el sistema solo guarda aprobado / no aprobado).
 *   La vigencia sale de training_topics.periodicidad_meses (misma fuente que Vencimientos, 0021); si el tema no
 *   vence, el pie dice "Sin vencimiento".
 * Configuración por secrets (todas opcionales; si falta una, esa parte se omite del PDF):
 *   PUBLIC_APP_URL (dominio de producción, para el QR) · EMPRESA_CUIT · EMPRESA_DOMICILIO.
 */

import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage, type PDFFont } from 'npm:pdf-lib@1.17.1';
import qrcode from 'npm:qrcode-generator@1.4.4';
import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, conflict, errorToResponse, jsonResponse, notFound } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readJsonLimited } from '../_shared/body.ts';
import { adminClient } from '../_shared/supabase.ts';
import { logoDecaPng } from '../_shared/logo-base64.ts';
import { winAnsiSafe } from '../_shared/pdf.ts';

const FN = 'generate-certificates';
const BUCKET = 'certificados-pdf';
const SIGNATURE_BUCKET = 'firmas-certificados';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TrainingRow {
  id: string;
  numero_registro: number;
  fecha_dictado: string;
  duracion_real: number;
  capacitador_id: string;
  estado: 'activa' | 'anulada';
  tiene_certificados: boolean;
  training_topics: { nombre: string; periodicidad_meses: number | null } | null;
  profiles: { nombre: string } | null;
  training_attendees: {
    id: string;
    resultado: 'aprobado' | 'no_aprobado';
    personnel: { dni: string; nombre: string; apellido: string; positions: { nombre: string } | null } | null;
  }[];
}

interface Signature {
  nombre: string;
  cargo: string;
  matricula: string;
  /** PNG de la firma, si está cargada. */
  imagen: Uint8Array | null;
}

/** Recursos iguales para todos los certificados de una misma corrida. */
interface Shared {
  logo: Uint8Array | null;
  signature: Signature | null;
  publicAppUrl: string | null;
  cuit: string | null;
  domicilio: string | null;
}

interface CertData {
  id: string;
  nombreCompleto: string;
  dni: string;
  puesto: string | null;
  tema: string;
  fecha: string;
  /** Vencimiento (AAAA-MM-DD) o null si el tema no vence. */
  venceEl: string | null;
  vigenciaMeses: number | null;
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

/** AAAA-MM-DD + n meses; si el día no existe en el mes destino queda el último (31/01 + 1 mes = 28/02). */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = total % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = rgb(0.1, 0.1, 0.1)) {
  const safe = winAnsiSafe(text);
  const width = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: (page.getWidth() - width) / 2, y, size, font, color });
}

/** Dibuja el QR como cuadraditos vectoriales (nítido al imprimir, sin imagen). */
function drawQr(page: PDFPage, url: string, x: number, y: number, size: number) {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const cell = size / n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      // +0.2 de solape para que no queden hilos blancos entre módulos al rasterizar.
      page.drawRectangle({ x: x + c * cell, y: y + size - (r + 1) * cell, width: cell + 0.2, height: cell + 0.2, color: rgb(0, 0, 0) });
    }
  }
}

async function buildPdf(c: CertData, shared: Shared): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(winAnsiSafe(`Certificado ${c.nroRegistro} - ${c.nombreCompleto}`));
  doc.setAuthor('Deca Electromecánica · Nexoris');
  // A4 apaisado.
  const page = doc.addPage([841.89, 595.28]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const gris = rgb(0.4, 0.4, 0.4);
  const grisClaro = rgb(0.78, 0.8, 0.83);
  const azul = rgb(0.04, 0.04, 0.42); // azul del logo de Deca
  const { width, height } = page.getSize();
  const left = 58;
  const right = width - 58;

  // Marco doble en el azul de la marca (como el de la demo): una línea gruesa afuera y una fina adentro.
  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: azul, borderWidth: 3 });
  page.drawRectangle({ x: 25, y: 25, width: width - 50, height: height - 50, borderColor: azul, borderWidth: 0.75 });

  // Encabezado: logo + (CUIT / domicilio) a la izquierda, "Certificado N.º" a la derecha.
  let logo: PDFImage | null = null;
  if (shared.logo) {
    try {
      logo = await doc.embedPng(shared.logo);
    } catch (e) {
      log(FN, 'warn', 'logo inválido, se usa el encabezado de texto', { error: String(e) });
    }
  }
  const headTop = height - 50;
  let textX = left;
  if (logo) {
    const h = 40;
    const w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: left, y: headTop - h, width: w, height: h });
    textX = left + w + 14;
  } else {
    page.drawText('DECA ELECTROMECÁNICA S.A.', { x: left, y: headTop - 26, size: 15, font: bold, color: azul });
    textX = left + bold.widthOfTextAtSize('DECA ELECTROMECÁNICA S.A.', 15) + 14;
  }
  const datosEmpresa = [shared.cuit ? `CUIT ${shared.cuit}` : null, shared.domicilio].filter((t): t is string => Boolean(t));
  if (datosEmpresa.length > 0) {
    page.drawLine({ start: { x: textX - 7, y: headTop - 4 }, end: { x: textX - 7, y: headTop - 36 }, thickness: 0.5, color: grisClaro });
    datosEmpresa.forEach((t, i) => page.drawText(winAnsiSafe(t), { x: textX, y: headTop - 16 - i * 13, size: 9, font: regular, color: gris }));
  }
  const rotuloNro = 'CERTIFICADO N.º';
  const nro = String(c.nroRegistro);
  page.drawText(rotuloNro, { x: right - regular.widthOfTextAtSize(rotuloNro, 8), y: headTop - 14, size: 8, font: bold, color: gris });
  page.drawText(nro, { x: right - bold.widthOfTextAtSize(nro, 13), y: headTop - 32, size: 13, font: bold });
  page.drawLine({ start: { x: left, y: headTop - 52 }, end: { x: right, y: headTop - 52 }, thickness: 0.5, color: grisClaro });

  // Cuerpo.
  drawCentered(page, 'CERTIFICADO DE CAPACITACIÓN', height - 163, bold, 13, azul);
  drawCentered(page, 'Se certifica que', height - 192, regular, 12, gris);
  drawCentered(page, c.nombreCompleto, height - 227, bold, 27);
  drawCentered(page, `DNI ${formatDni(c.dni)}${c.puesto ? `  ·  ${c.puesto}` : ''}`, height - 249, regular, 12, gris);
  drawCentered(page, 'ha completado y aprobado satisfactoriamente la capacitación', height - 282, regular, 12, gris);
  drawCentered(page, c.tema, height - 312, bold, 20);
  drawCentered(
    page,
    `con una carga horaria de ${c.duracion.toLocaleString('es-AR')} h. Resultado: Aprobado.`,
    height - 334,
    regular,
    12,
    gris,
  );
  drawCentered(page, `Dictada el ${formatDate(c.fecha)} por ${c.capacitador}  ·  Emitido el ${formatDate(c.emitido)}`, height - 358, regular, 10.5);

  // Pie en tres columnas, como la demo: firma · QR · vigencia.
  const footerTop = 172;
  page.drawLine({ start: { x: left, y: footerTop }, end: { x: right, y: footerTop }, thickness: 0.5, color: grisClaro });

  // Izquierda: firma del Responsable de Seg. e Higiene (línea en blanco si no hay nadie cargado).
  const sigW = 200;
  const sigX1 = left + 20;
  const sigY = 98;
  const sig = shared.signature;
  if (sig?.imagen) {
    try {
      const img = await doc.embedPng(sig.imagen);
      const scale = Math.min(52 / img.height, sigW / img.width);
      const w = img.width * scale;
      page.drawImage(img, { x: sigX1 + (sigW - w) / 2, y: sigY + 3, width: w, height: img.height * scale });
    } catch (e) {
      log(FN, 'warn', 'imagen de firma inválida, la línea queda en blanco', { error: String(e) });
    }
  }
  page.drawLine({ start: { x: sigX1, y: sigY }, end: { x: sigX1 + sigW, y: sigY }, thickness: 0.75, color: rgb(0.35, 0.35, 0.35) });
  const rotulo = sig ? [sig.nombre, sig.cargo, sig.matricula ? `Mat. ${sig.matricula}` : ''].filter(Boolean) : [];
  if (rotulo.length === 0) rotulo.push('Responsable de Seguridad e Higiene');
  rotulo.forEach((t, i) => {
    const safe = winAnsiSafe(t);
    const f = i === 0 && sig ? bold : regular;
    page.drawText(safe, { x: sigX1 + (sigW - f.widthOfTextAtSize(safe, 9)) / 2, y: sigY - 13 - i * 11, size: 9, font: f, color: i === 0 && sig ? rgb(0.1, 0.1, 0.1) : gris });
  });

  // Centro: QR de verificación.
  if (shared.publicAppUrl) {
    const qrSize = 80;
    const qrX = (width - qrSize) / 2;
    drawQr(page, `${shared.publicAppUrl}/certificado/${c.id}`, qrX, 70, qrSize);
    const t = 'VERIFICACIÓN';
    page.drawText(winAnsiSafe(t), { x: (width - regular.widthOfTextAtSize(winAnsiSafe(t), 7.5)) / 2, y: 56, size: 7.5, font: regular, color: gris });
  }

  // Derecha: vigencia (la misma regla que Vencimientos: fecha de dictado + periodicidad del tema).
  const colRightCenter = right - 20 - sigW / 2;
  const centerText = (t: string, y: number, f: PDFFont, size: number, color = rgb(0.1, 0.1, 0.1)) => {
    const safe = winAnsiSafe(t);
    page.drawText(safe, { x: colRightCenter - f.widthOfTextAtSize(safe, size) / 2, y, size, font: f, color });
  };
  centerText('VÁLIDO HASTA', 118, bold, 8, gris);
  if (c.venceEl) {
    centerText(formatDate(c.venceEl), 98, bold, 15);
    if (c.vigenciaMeses) centerText(`Vigencia ${c.vigenciaMeses} ${c.vigenciaMeses === 1 ? 'mes' : 'meses'}`, 82, regular, 9, gris);
  } else {
    centerText('Sin vencimiento', 98, bold, 13);
  }

  return await doc.save();
}

/**
 * Logo embebido como base64 (logo-base64.ts): un PNG leído con Deno.readFile no viaja con el deploy.
 * Si por algún motivo no se puede decodificar, devuelve null y el PDF usa el encabezado de texto.
 */
function loadLogo(): Uint8Array | null {
  try {
    return logoDecaPng();
  } catch (e) {
    log(FN, 'warn', 'no se pudo decodificar el logo embebido', { error: String(e) });
    return null;
  }
}

/** Firma del Responsable de Seg. e Higiene (fila única). Sin nombre cargado = línea en blanco. */
async function loadSignature(admin: ReturnType<typeof adminClient>): Promise<Signature | null> {
  const { data } = await admin.from('certificate_signature_settings').select('*').eq('id', 1).maybeSingle();
  const nombre = (data?.responsable_nombre ?? '').trim();
  if (!data || !nombre) return null;
  let imagen: Uint8Array | null = null;
  if (data.responsable_firma_path) {
    const { data: blob } = await admin.storage.from(SIGNATURE_BUCKET).download(data.responsable_firma_path);
    if (blob) imagen = new Uint8Array(await blob.arrayBuffer());
  }
  return { nombre, cargo: (data.responsable_cargo ?? '').trim(), matricula: (data.responsable_matricula ?? '').trim(), imagen };
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
          'training_topics(nombre, periodicidad_meses), profiles(nombre), ' +
          'training_attendees(id, resultado, personnel(dni, nombre, apellido, positions(nombre)))',
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
    const publicAppUrl = (Deno.env.get('PUBLIC_APP_URL') ?? '').trim().replace(/\/+$/, '') || null;
    if (!publicAppUrl) log(FN, 'warn', 'Falta PUBLIC_APP_URL: los certificados salen sin QR');
    const shared: Shared = {
      logo: loadLogo(),
      signature: await loadSignature(admin),
      publicAppUrl,
      cuit: Deno.env.get('EMPRESA_CUIT')?.trim() || null,
      domicilio: Deno.env.get('EMPRESA_DOMICILIO')?.trim() || null,
    };
    const periodicidad = t.training_topics?.periodicidad_meses ?? null;

    const items: { id: string; attendee_id: string; storage_path: string }[] = [];
    for (const a of aprobados) {
      const p = a.personnel!;
      // El id se define acá (y no en la base) porque el QR del PDF tiene que apuntar a él.
      const certId = crypto.randomUUID();
      const pdf = await buildPdf(
        {
          id: certId,
          nombreCompleto: `${p.nombre} ${p.apellido}`,
          dni: p.dni,
          puesto: p.positions?.nombre ?? null,
          tema: t.training_topics?.nombre ?? 'Capacitación',
          fecha: t.fecha_dictado,
          venceEl: periodicidad ? addMonths(t.fecha_dictado, periodicidad) : null,
          vigenciaMeses: periodicidad,
          duracion: Number(t.duracion_real),
          capacitador: t.profiles?.nombre ?? '—',
          nroRegistro: t.numero_registro,
          emitido,
        },
        shared,
      );
      // Nombre único por archivo: nunca se pisa un PDF existente (upsert: false además lo impide).
      const path = `${t.numero_registro}/${a.id}/${crypto.randomUUID()}.pdf`;
      const { error: upError } = await admin.storage
        .from(BUCKET)
        .upload(path, pdf, { contentType: 'application/pdf', upsert: false });
      if (upError) throw new HttpError(500, 'No se pudo guardar un certificado');
      subidos.push(path);
      items.push({ id: certId, attendee_id: a.id, storage_path: path });
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
