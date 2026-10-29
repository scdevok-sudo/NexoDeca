/**
 * components/layout/AppShell.tsx — Estructura de las pantallas internas (sidebar + topbar + contenido).
 * Módulo: Setup (layout compartido).
 *
 * Responsive: en <768px el menú vive en un drawer con hamburguesa (MobileNav); desde 768px pasa a
 * barra lateral fija (Sidebar). TODO(SETUP) de menú colapsable en mobile: cerrado.
 * PERMISOS: la vista pública /consulta (M7) NO usa este layout.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 bg-slate-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
