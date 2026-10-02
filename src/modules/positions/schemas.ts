/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

export const positionSchema = z.object({
  // REGLA DE NEGOCIO: nombre único (lo garantiza un UNIQUE en la base; el 409 lo mapeamos en api.ts).
  nombre: z.string().min(1),
  descripcion: z.string(),
  activo: z.boolean(),
});

export type PositionFormValues = z.infer<typeof positionSchema>;
