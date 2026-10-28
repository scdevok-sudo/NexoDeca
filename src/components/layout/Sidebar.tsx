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
import logoBlanco from '../../assets/logo-deca-blanco.png';

export function Sidebar() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((i) => user && i.roles.includes(user.rol));

  return (
    <nav className="flex gap-1 overflow-x-auto bg-brand-900 p-2 text-sm text-white md:w-56 md:flex-col md:overflow-visible md:p-4">
      <div className="hidden px-2 pb-4 md:block">
        <img src={logoBlanco} alt="Deca Electromecánica" className="h-auto w-full" />
        <span className="mt-2 block text-xs font-medium tracking-wide text-brand-200">SGI · Capacitaciones</span>
      </div>
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          className={({ isActive }) =>
            'whitespace-nowrap rounded-md px-3 py-2 ' +
            (isActive ? 'bg-brand-700 font-medium' : 'text-brand-100 hover:bg-brand-800 hover:text-white')
          }
        >
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
