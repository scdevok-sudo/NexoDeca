/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * La validación del cliente es comodidad: create-trainer-user repite estas reglas en el servidor.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(254),
  // REGLA DE NEGOCIO: las contraseñas las gestiona Supabase Auth, acá solo validamos que no venga vacía.
  password: z.string().min(1, 'Ingresá la contraseña').max(72),
});

/** Nombre visible: arranca con letra (evita inyección de fórmulas si después se exporta a Excel). */
const nombreVisible = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .max(100, 'Máximo 100 caracteres')
  .regex(/^\p{L}[\p{L}\s'.-]*$/u, 'Solo letras, espacios, apóstrofo, punto o guion');

export const createTrainerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(254),
  nombre: nombreVisible,
  // TODO(consultar a Santi): política de contraseña. Mínimo 8; máximo 72 (límite de bcrypt en Supabase Auth).
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type CreateTrainerFormValues = z.input<typeof createTrainerSchema>;
