/**
 * components/layout/Topbar.tsx — Barra superior con usuario y cierre de sesión.
 * Módulo: Setup / M1 (cierre de sesión).
 */

import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../ui/Button';
import logo from '../../assets/logo-deca.png';

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
      {/* En desktop/tablet el logo está en el Sidebar: acá solo se muestra en mobile, donde el Sidebar no lo trae. */}
      <img src={logo} alt="Deca Electromecánica" className="mr-3 h-6 w-auto md:hidden" />
      <span className="ml-auto mr-3 truncate text-slate-900 md:ml-0 md:mr-0">
        {user?.nombre} <span className="text-slate-500">({user?.rol})</span>
      </span>
      <Button variant="secondary" onClick={handleSignOut} loading={busy}>
        Salir
      </Button>
    </header>
  );
}
