/**
 * components/layout/Topbar.tsx — Barra superior con usuario, cierre de sesión y botón de menú.
 * Módulo: Setup / M1 (cierre de sesión).
 */

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../ui/Button';
import logo from '../../assets/logo-deca.png';

interface Props {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: Props) {
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
      {/* En desktop/tablet el menú está en el Sidebar fijo: este botón y el logo solo se muestran en mobile. */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 text-slate-600 transition-colors duration-100 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transition-none"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <img src={logo} alt="Deca Electromecánica" className="h-6 w-auto" />
      </div>
      <span className="ml-auto mr-3 truncate text-slate-900 md:ml-0 md:mr-0">
        {user?.nombre} <span className="text-slate-500">({user?.rol})</span>
      </span>
      <Button variant="secondary" onClick={handleSignOut} loading={busy}>
        Salir
      </Button>
    </header>
  );
}
