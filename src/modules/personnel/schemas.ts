/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD');

export const personSchema = z.object({
  // TODO(M2): confirmar formato de DNI (7-8 dígitos, solo números) y validarlo igual en la Edge Function.
  dni: z.string().regex(/^\d{7,8}$/),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  // REGLA DE NEGOCIO: el puesto debe existir y estar activo (se verifica en el servidor, no solo acá).
  puestoId: z.string().min(1),
  fechaIngreso: fechaISO,
});

// TODO(M2): definir el formato exacto del CSV (columnas y separador). TODO(consultar a Santi) si Juan ya tiene una planilla modelo.
export const importRowSchema = personSchema.extend({
  // En el CSV el puesto puede venir por nombre; la Edge Function lo resuelve a id.
  puestoId: z.string().optional(),
  puesto: z.string().min(1),
});

export type PersonFormValues = z.infer<typeof personSchema>;
