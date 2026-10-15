/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';
const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

export const positionSchema = z.object({
  // REGLA DE NEGOCIO: nombre único (UNIQUE sobre lower(btrim(nombre)); el 409 se mapea en api.ts).
  nombre: z
    .string()
    .transform(normalize)
    .pipe(
      z
        .string()
        .min(1, 'Ingresá el nombre del puesto')
        .max(80, 'Máximo 80 caracteres')
        // Evita inyección de fórmulas cuando el puesto se exporta a Excel (reporte M9).
        .refine((s) => !/^[=+\-@]/.test(s), 'No puede empezar con =, +, - ni @'),
    ),
  descripcion: z.string().transform((s) => s.trim()).pipe(z.string().max(500, 'Máximo 500 caracteres')),
  activo: z.boolean(),
});

export type PositionFormValues = z.input<typeof positionSchema>;
