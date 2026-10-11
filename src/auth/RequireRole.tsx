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
import { Link, Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../types/common';
import { useAuth } from './useAuth';
import { EmptyState } from '../components/ui/EmptyState';

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <EmptyState title="Cargando sesión…" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!roles.includes(user.rol)) {
    return (
      <div className="p-8 text-center">
        <EmptyState title="No tenés permiso para ver esta pantalla" />
        <Link to="/" className="text-sm text-slate-700 underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}