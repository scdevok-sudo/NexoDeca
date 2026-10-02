/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { UUID, ISODate } from '../../types/common';

export interface Certificate {
  id: UUID;
  personId: UUID;
  trainingId: UUID;
  temaNombre: string;
  fecha: ISODate;
  nroRegistro: number;
  /** Versión del PDF; al regenerar se crea una nueva y la vieja queda de histórico. */
  version: number;
  vigente: boolean;
}

/** Lo que devuelve la consulta pública por DNI: solo datos de ESA persona. */
export interface PublicCertificateItem {
  id: UUID;
  temaNombre: string;
  fecha: ISODate;
  nroRegistro: number;
  downloadUrl: string;
}

export interface PublicLookupResult {
  // REGLA DE NEGOCIO: misma forma de respuesta exista o no el DNI, para no confirmar ni negar existencia.
  certificados: PublicCertificateItem[];
}
