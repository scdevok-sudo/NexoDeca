/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { Certificate, PublicCertificateItem, PublicLookupResult } from './types';

/**
 * GET /certificates/by-dni/{dni}
 * PERMISOS: público (sin login)
 * REGLA DE NEGOCIO: Solo DNI exacto: nunca listados ni búsqueda parcial por nombre.
 * TODO(M7): Invoca la Edge Function certificates-by-dni.
 * TODO(M7): Errores: 404 si no hay certificados o el DNI no existe, respondiendo IGUAL en ambos casos.
 */
export async function getCertificatesByDni(dni: string): Promise<PublicLookupResult> {
  throw new Error('Not implemented: getCertificatesByDni');
}

/**
 * GET /personnel/{id}/certificates
 * PERMISOS: Gerente, Capacitador
 * TODO(M7): Historial interno completo, incluyendo versiones viejas si corresponde.
 */
export async function listPersonCertificates(personId: UUID): Promise<Certificate[]> {
  throw new Error('Not implemented: listPersonCertificates');
}

/**
 * GET /certificates/{id}/download
 * PERMISOS: público por DNI (si es de esa persona) o Gerente/Capacitador
 * TODO(consultar a Santi): cómo se valida "si corresponde a esa persona" sin login (URL firmada? DNI como parámetro?).
 */
export async function downloadCertificate(id: UUID): Promise<Blob> {
  throw new Error('Not implemented: downloadCertificate');
}

/**
 * POST functions/generate-certificates
 * PERMISOS: Capacitador, Gerente
 * REGLA DE NEGOCIO: PDF inmutable: regenerar crea versión nueva, nunca sobrescribe.
 * TODO(consultar a Santi): la spec no define el endpoint ni el disparador ("al cerrar la capacitación").
 */
export async function generateCertificates(trainingId: UUID): Promise<Certificate[]> {
  throw new Error('Not implemented: generateCertificates');
}
