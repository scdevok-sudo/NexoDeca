/**
 * components/layout/Topbar.tsx — Barra superior con usuario y cierre de sesión.
 * Módulo: Setup / M1 (cierre de sesión).
 */

import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../ui/Button';

export function Topbar() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
    const handleSignOut = () => {
    setBusy(true);
    void signOut()
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-sm">
      <span>
        {user?.nombre} <span className="text-slate-500">({user?.rol})</span>
      </span>
      <Button variant="secondary" onClick={handleSignOut} disabled={busy}>
        Salir
      </Button>
    </header>
  );
}
