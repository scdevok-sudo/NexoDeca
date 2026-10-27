/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 *
 * Los PDF viven en un bucket privado (0016): nunca se leen directo. Se descargan con URLs firmadas de vida corta
 *   que arman las Edge Functions (certificates-by-dni para el público, certificate-download para uso interno).
 */

import { supabase } from '../../lib/supabase';
import { ApiError, fromFunctionsError, fromPostgrestError } from '../../lib/apiError';
import type { UUID } from '../../types/common';
import type {
  Certificate,
  CertificateStatus,
  CertificateVerification,
  PublicLookupResult,
  SignatureSettings,
  TrainingCertificate,
} from './types';
import { dniLookupSchema, signatureSettingsSchema, type SignatureSettingsFormValues } from './schemas';

const ERRORS = {
  '42501': 'No tenés permiso para ver certificados',
};

/**
 * GET /certificates/by-dni/{dni} → Edge Function certificates-by-dni (pública).
 * PERMISOS: público (sin login).
 * REGLA DE NEGOCIO: Solo DNI exacto: nunca listados ni búsqueda parcial por nombre.
 * REGLA DE NEGOCIO: la función responde 404 IGUAL si el DNI no existe o no tiene certificados; acá ambos casos
 *   se devuelven como lista vacía (la pantalla muestra un único mensaje genérico).
 * Errores: 400 si el DNI tiene formato inválido.
 */
export async function getCertificatesByDni(dni: string): Promise<PublicLookupResult> {
  const parsed = dniLookupSchema.safeParse({ dni });
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'DNI inválido');

  const { data, error } = await supabase.functions.invoke<PublicLookupResult>('certificates-by-dni', {
    body: { dni: parsed.data.dni },
  });
  if (error) {
    const apiError = await fromFunctionsError(error);
    if (apiError.status === 404) return { certificados: [] };
    throw apiError;
  }
  return { certificados: data?.certificados ?? [] };
}

/**
 * GET /personnel/{id}/certificates
 * PERMISOS: Gerente, Capacitador (RLS certificates_select, 0015).
 * Historial interno completo: todas las versiones (vigente, reemplazado, anulado), lo más nuevo primero.
 */
export async function listPersonCertificates(personId: UUID): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      'id, numero_registro, estado, created_at, ' +
        'training_attendees!inner(person_id, training_id, trainings(fecha_dictado, training_topics(nombre)))',
    )
    .eq('training_attendees.person_id', personId)
    .order('created_at', { ascending: false });
  if (error) throw fromPostgrestError(error, ERRORS);

  const rows = (data ?? []) as unknown as {
    id: string;
    numero_registro: number;
    estado: CertificateStatus;
    created_at: string;
    training_attendees: {
      person_id: string;
      training_id: string;
      trainings: { fecha_dictado: string; training_topics: { nombre: string } | null } | null;
    };
  }[];
  return rows.map((r) => ({
    id: r.id,
    personId: r.training_attendees.person_id,
    trainingId: r.training_attendees.training_id,
    temaNombre: r.training_attendees.trainings?.training_topics?.nombre ?? 'Tema desconocido',
    fecha: r.training_attendees.trainings?.fecha_dictado ?? '',
    nroRegistro: r.numero_registro,
    estado: r.estado,
    emitidoEl: r.created_at,
  }));
}

/**
 * Certificados de los asistentes de una capacitación (para la tabla de asistentes, M6).
 * PERMISOS: Gerente, Capacitador (RLS certificates_select). No está en la spec: hace falta para descargar desde M6.
 */
export async function listTrainingCertificates(trainingId: UUID): Promise<TrainingCertificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, estado, created_at, training_attendees!inner(person_id, training_id)')
    .eq('training_attendees.training_id', trainingId)
    .order('created_at', { ascending: false });
  if (error) throw fromPostgrestError(error, ERRORS);
  const rows = (data ?? []) as unknown as {
    id: string;
    estado: CertificateStatus;
    training_attendees: { person_id: string };
  }[];
  return rows.map((r) => ({ id: r.id, personId: r.training_attendees.person_id, estado: r.estado }));
}

/**
 * GET /certificates/{id}/download → Edge Function certificate-download (uso interno).
 * PERMISOS: Gerente/Capacitador. El público descarga con las URLs que ya trae getCertificatesByDni.
 * Devuelve una URL firmada que vence a los 2 minutos (descarga el PDF como adjunto).
 */
export async function getCertificateDownloadUrl(id: UUID): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>('certificate-download', {
    body: { certificateId: id },
  });
  if (error) throw await fromFunctionsError(error);
  if (!data?.url) throw new ApiError(500, 'Respuesta vacía del servidor');
  return data.url;
}

/**
 * Cierra la capacitación y genera los certificados → Edge Function generate-certificates.
 * PERMISOS: Gerente (cualquiera) y Capacitador (las propias) — lo verifica la Edge Function.
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): el "cierre" es explícito; después no se edita (M6).
 * REGLA DE NEGOCIO: PDF inmutable: nunca se sobrescribe un archivo.
 * Errores: 400 sin aprobados; 404; 409 anulada o ya cerrada.
 */
export async function generateCertificates(trainingId: UUID): Promise<{ generados: number }> {
  const { data, error } = await supabase.functions.invoke<{ generados: number }>('generate-certificates', {
    body: { trainingId },
  });
  if (error) throw await fromFunctionsError(error);
  return { generados: data?.generados ?? 0 };
}

/**
 * Verificación pública de un certificado por id → Edge Function certificate-verify (la abre el QR del PDF).
 * PERMISOS: público (sin login). Devuelve datos mínimos; nunca DNI ni el PDF.
 * Devuelve null si no existe (la función responde 404 igual para un id inexistente o mal formado).
 */
export async function verifyCertificate(id: string): Promise<CertificateVerification | null> {
  const { data, error } = await supabase.functions.invoke<CertificateVerification>('certificate-verify', { body: { id } });
  if (error) {
    const apiError = await fromFunctionsError(error);
    if (apiError.status === 404) return null;
    throw apiError;
  }
  return data ?? null;
}

const SIGNATURE_BUCKET = 'firmas-certificados';
const SIGNATURE_PATH = 'firma-responsable.png';
const SIGNATURE_MAX_BYTES = 512 * 1024;

/**
 * Firma del Responsable de Seg. e Higiene (fila única id = 1).
 * PERMISOS: solo Gerente (RLS cert_signature_*, 0024). Devuelve vacío si todavía no se cargó nada.
 */
export async function getSignatureSettings(): Promise<SignatureSettings> {
  const { data, error } = await supabase
    .from('certificate_signature_settings')
    .select('responsable_nombre, responsable_cargo, responsable_matricula, responsable_firma_path')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw fromPostgrestError(error, ERRORS);
  return {
    nombre: data?.responsable_nombre ?? '',
    cargo: data?.responsable_cargo ?? '',
    matricula: data?.responsable_matricula ?? '',
    firmaPath: data?.responsable_firma_path ?? null,
  };
}

/**
 * Guarda nombre/cargo/matrícula y, si viene, reemplaza la imagen de la firma (PNG, máx. 512 KB).
 * PERMISOS: solo Gerente (RLS + policies del bucket).
 * REGLA DE NEGOCIO: la firma es configuración, se puede reemplazar. Los PDF ya emitidos no cambian.
 */
export async function saveSignatureSettings(values: SignatureSettingsFormValues, file?: File | null): Promise<void> {
  const parsed = signatureSettingsSchema.safeParse(values);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos inválidos');

  let firmaPath: string | undefined;
  if (file) {
    if (file.type !== 'image/png') throw new ApiError(400, 'La firma tiene que ser una imagen PNG');
    if (file.size > SIGNATURE_MAX_BYTES) throw new ApiError(400, 'La imagen pesa más de 512 KB');
    const { error: upError } = await supabase.storage
      .from(SIGNATURE_BUCKET)
      .upload(SIGNATURE_PATH, file, { contentType: 'image/png', upsert: true });
    if (upError) throw new ApiError(500, 'No se pudo subir la imagen de la firma');
    firmaPath = SIGNATURE_PATH;
  }

  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('certificate_signature_settings').upsert({
    id: 1,
    responsable_nombre: parsed.data.nombre || null,
    responsable_cargo: parsed.data.cargo || null,
    responsable_matricula: parsed.data.matricula || null,
    ...(firmaPath ? { responsable_firma_path: firmaPath } : {}),
    updated_at: new Date().toISOString(),
    updated_by: auth.user?.id ?? null,
  });
  if (error) throw fromPostgrestError(error, ERRORS);
}
