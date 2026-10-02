/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

export const topicSchema = z.object({
  // REGLA DE NEGOCIO: nombre único.
  nombre: z.string().min(1),
  tipo: z.enum(['obligatorio', 'electivo']),
  // TODO(M4): ¿puede un tema no tener puestos? TODO(consultar a Santi).
  puestoIds: z.array(z.string()),
  // Vacío (null) = el tema no vence.
  periodicidadMeses: z.number().int().positive().nullable(),
  duracionHoras: z.number().positive(),
  activo: z.boolean(),
});

export type TopicFormValues = z.infer<typeof topicSchema>;
