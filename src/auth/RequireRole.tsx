/**
 * auth/RequireRole.tsx — Guard de rutas por rol.
 * Módulo: M1 · Login y sesiones (spec §1: "verificación de sesión y de rol en cada pantalla protegida")
 *
 * Qué tiene que hacer:
 *  - Sin sesión → /login.
 *  - Con sesión pero rol no permitido → pantalla de acceso denegado (403).
 *
 * PERMISOS: esto es solo UX. El permiso de verdad lo imponen RLS y las Edge Functions.
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '../types/common';
import { useAuth } from './useAuth';
import { EmptyState } from '../components/ui/EmptyState';

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <EmptyState title="Cargando sesión…" />;
  // TODO(M1): recordar la ruta de origen para volver después del login.
  if (!user) return <Navigate to="/login" replace />;
  // TODO(M1): pantalla 403 propia.
  if (!roles.includes(user.rol)) return <EmptyState title="No tenés permiso para ver esta pantalla" />;

  return <>{children}</>;
}
