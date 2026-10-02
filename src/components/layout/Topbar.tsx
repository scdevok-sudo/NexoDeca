/**
 * components/layout/Topbar.tsx — Barra superior con usuario y cierre de sesión.
 * Módulo: Setup / M1 (cierre de sesión).
 */

import { useAuth } from '../../auth/useAuth';
import { Button } from '../ui/Button';

export function Topbar() {
  const { user, signOut } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-sm">
      <span>
        {user?.nombre} <span className="text-slate-500">({user?.rol})</span>
      </span>
      {/* TODO(M1): manejar el error de signOut y redirigir a /login. */}
      <Button variant="secondary" onClick={() => void signOut().catch(() => undefined)}>
        Salir
      </Button>
    </header>
  );
}
