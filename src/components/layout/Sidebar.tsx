/**
 * components/layout/Sidebar.tsx — Menú de navegación según rol.
 * Módulo: Setup (layout compartido).
 *
 * PERMISOS: se muestran solo los ítems que el rol puede ver (routes/navItems.ts).
 * Ocultar un ítem NO es seguridad: lo real está en RLS / Edge Functions.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { NAV_ITEMS } from '../../routes/navItems';

export function Sidebar() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((i) => user && i.roles.includes(user.rol));

  return (
    <nav className="flex gap-1 overflow-x-auto bg-slate-900 p-2 text-sm text-white md:w-56 md:flex-col md:overflow-visible md:p-4">
      <span className="hidden px-2 pb-3 font-semibold md:block">SGI · Deca</span>
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          className={({ isActive }) =>
            'whitespace-nowrap rounded px-3 py-2 ' + (isActive ? 'bg-slate-700' : 'hover:bg-slate-800')
          }
        >
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
