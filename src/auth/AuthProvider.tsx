/**
 * auth/AuthProvider.tsx — Contexto de sesión (usuario + rol).
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * - Escucha onAuthStateChange (dispara INITIAL_SESSION al suscribirse, así que no hace falta getSession aparte).
 * - Carga el perfil (rol) de la tabla profiles. Usuario de Auth sin perfil → se cierra la sesión.
 * PERMISOS: el rol de acá solo decide qué UI mostrar; la seguridad real es RLS / Edge Functions.
 */

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { fetchProfile, login, logout } from '../modules/login/api';
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
// En `vite build` import.meta.env.DEV es false y este código queda muerto. Las llamadas a datos igual las corta RLS.
function devBypassUser(): AuthUser | null {
  const rol = import.meta.env.VITE_DEV_BYPASS_ROLE;
  if (import.meta.env.DEV && (rol === 'gerente' || rol === 'capacitador')) {
    return { id: 'dev', email: 'dev@local', nombre: 'Usuario DEV (' + rol + ')', rol };
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(devBypassUser);
  const [loading, setLoading] = useState(() => devBypassUser() === null);
  const isBypass = devBypassUser() !== null;
  // Evita que una carga de perfil vieja pise a una más nueva (logins/logouts rápidos).
  const loadSeq = useRef(0);

  const loadFromSession = useCallback(async (session: Session | null) => {
    const seq = ++loadSeq.current;
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await fetchProfile(session.user.id, session.user.email ?? '');
      if (seq !== loadSeq.current) return;
      if (!profile) {
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(profile);
      }
    } catch {
      if (seq === loadSeq.current) setUser(null);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBypass) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED no cambia el usuario: no recargamos el perfil.
      if (event === 'TOKEN_REFRESHED') return;
      if (event === 'SIGNED_OUT') queryClient.clear();
      // setTimeout: Supabase recomienda no llamar a otros métodos de supabase dentro del callback (deadlock).
      setTimeout(() => void loadFromSession(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [isBypass, loadFromSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const profile = await login({ email, password });
    loadSeq.current++;
    setUser(profile);
  }, []);

  const signOut = useCallback(async () => {
    loadSeq.current++;
    setUser(null);
    await logout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
