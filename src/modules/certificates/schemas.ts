/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

// REGLA DE NEGOCIO: el único dato de entrada de la consulta pública es el DNI exacto.
export const dniLookupSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/),
});

export type DniLookupValues = z.infer<typeof dniLookupSchema>;
