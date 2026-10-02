/**
 * auth/useAuth.ts — Hook para leer la sesión desde cualquier componente.
 * Módulo: M1 · Login y sesiones
 */

import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export function useAuth() {
  const ctx = useContext(AuthContext);
  // Si esto salta, falta envolver la app en <AuthProvider>.
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
