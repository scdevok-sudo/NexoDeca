/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

// REGLA DE NEGOCIO: el único dato de entrada de la consulta pública es el DNI exacto.
// Se aceptan puntos y espacios ("30.123.456"), como en Personal; se normalizan antes de validar
//   (la Edge Function certificates-by-dni hace lo mismo).
export const dniLookupSchema = z.object({
  dni: z
    .string()
    .transform((s) => s.trim().replace(/[.\s]/g, ''))
    .pipe(z.string().regex(/^\d{7,8}$/, 'Ingresá tu DNI: 7 u 8 números')),
});

export type DniLookupValues = z.infer<typeof dniLookupSchema>;

/** Firma del Responsable de Seg. e Higiene. Todo opcional: sin nombre, el certificado deja la línea en blanco. */
export const signatureSettingsSchema = z.object({
  nombre: z.string().trim().max(120, 'Máximo 120 caracteres'),
  cargo: z.string().trim().max(120, 'Máximo 120 caracteres'),
  matricula: z.string().trim().max(60, 'Máximo 60 caracteres'),
});
export type SignatureSettingsFormValues = z.infer<typeof signatureSettingsSchema>;
