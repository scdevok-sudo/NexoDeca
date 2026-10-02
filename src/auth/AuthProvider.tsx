/**
 * auth/AuthProvider.tsx — Contexto de sesión (usuario + rol).
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Cargar la sesión de Supabase Auth y el perfil (rol) del usuario.
 *  - Suscribirse a onAuthStateChange.
 *  - Exponer signIn / signOut.
 */

import { createContext, useMemo, type ReactNode } from 'react';
import type { Role } from '../types/common';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: Role;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// STUB: en DEV, VITE_DEV_BYPASS_ROLE=gerente|capacitador simula una sesión para poder navegar las pantallas.
function devBypassUser(): AuthUser | null {
  const rol = import.meta.env.VITE_DEV_BYPASS_ROLE;
  if (import.meta.env.DEV && (rol === 'gerente' || rol === 'capacitador')) {
    return { id: 'dev', email: 'dev@local', nombre: 'Usuario DEV (' + rol + ')', rol };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO(M1): reemplazar por la sesión real (supabase.auth.getSession + onAuthStateChange + lectura de profiles).
  // REGLA DE NEGOCIO: las contraseñas las gestiona Supabase Auth, nunca hash a mano.
  // PERMISOS: el rol que se usa para mostrar/ocultar UI sale del perfil, pero la seguridad real es RLS / Edge Functions.
  const value = useMemo<AuthContextValue>(
    () => ({
      user: devBypassUser(),
      loading: false,
      signIn: async () => {
        throw new Error('Not implemented: signIn');
      },
      signOut: async () => {
        throw new Error('Not implemented: signOut');
      },
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
