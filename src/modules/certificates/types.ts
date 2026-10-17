/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate } from '../../types/common';

/**
 * Valores del enum certificate_status (0015 + 0020).
 * vigente: el que vale · reemplazado: versión vieja (histórico) · anulado: de una capacitación anulada.
 */
export type CertificateStatus = 'vigente' | 'reemplazado' | 'anulado';

/** Historial interno (Gerente / Capacitador): incluye todas las versiones, para auditoría. */
export interface Certificate {
  id: UUID;
  personId: UUID;
  trainingId: UUID;
  temaNombre: string;
  fecha: ISODate;
  nroRegistro: number;
  estado: CertificateStatus;
  /** Cuándo se generó el PDF (timestamp ISO). */
  emitidoEl: string;
}

/** Certificado de un asistente, para la tabla de asistentes de una capacitación (M6). */
export interface TrainingCertificate {
  id: UUID;
  personId: UUID;
  estado: CertificateStatus;
}

/** Lo que devuelve la consulta pública por DNI: solo datos de ESA persona. */
export interface PublicCertificateItem {
  id: UUID;
  temaNombre: string;
  fecha: ISODate;
  nroRegistro: number;
  /** URL firmada de vida corta (10 min). */
  downloadUrl: string;
}

export interface PublicLookupResult {
  // REGLA DE NEGOCIO: misma respuesta exista o no el DNI, para no confirmar ni negar existencia.
  certificados: PublicCertificateItem[];
}
