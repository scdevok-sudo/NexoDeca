/**
 * components/layout/AppShell.tsx — Estructura de las pantallas internas (sidebar + topbar + contenido).
 * Módulo: Setup (layout compartido).
 *
 * Responsive: en <767px el menú queda arriba en horizontal; desde 768px pasa a barra lateral.
 * TODO(SETUP): menú colapsable en mobile.
 * PERMISOS: la vista pública /consulta (M7) NO usa este layout.
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-slate-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
