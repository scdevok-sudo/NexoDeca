/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Completar las reglas de la spec. La validación del cliente es comodidad: el servidor/RLS repite todo.
 */

import { z } from 'zod';

// TODO(M1): validar en cliente Y en servidor (la Edge Function repite estas reglas).
export const loginSchema = z.object({
  email: z.string().email(),
  // REGLA DE NEGOCIO: las contraseñas las gestiona Supabase Auth, acá solo validamos que no venga vacía.
  password: z.string().min(1),
});

export const createTrainerSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1),
  // TODO(M1): política mínima de contraseña (a confirmar con Santi).
  password: z.string().min(8),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type CreateTrainerFormValues = z.infer<typeof createTrainerSchema>;
