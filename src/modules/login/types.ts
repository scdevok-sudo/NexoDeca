/**
 * types.ts — Tipos e interfaces del módulo.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Ajustar los tipos a lo que devuelva realmente Supabase (database.types.ts).
 */

import type { Role, UUID } from '../../types/common';

/** Datos del usuario autenticado (GET /auth/me). */
export interface AuthUser {
  id: UUID;
  email: string;
  nombre: string;
  rol: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Entrada para que el Gerente cree una cuenta de Capacitador. */
export interface CreateTrainerInput {
  email: string;
  nombre: string;
  // Contraseña inicial que define el Gerente (no hay mails automáticos en Fase 1).
  // Forzar cambio?
  password: string;
}