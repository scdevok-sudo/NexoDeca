/**
 * routes/navItems.ts — Ítems del menú lateral según rol.
 * Módulo: Setup / M1.
 *
 * PERMISOS: el menú se arma según el rol, pero ocultar un ítem NO es seguridad.
 */

import type { Role } from '../types/common';

export interface NavItem {
  label: string;
  to: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Capacitadores', to: '/trainers', roles: ['gerente'] },
  { label: 'Personal', to: '/personnel', roles: ['gerente', 'capacitador'] },
  { label: 'Puestos', to: '/positions', roles: ['gerente', 'capacitador'] },
  { label: 'Temas', to: '/topics', roles: ['gerente', 'capacitador'] },
  { label: 'Plan anual', to: '/plan', roles: ['gerente', 'capacitador'] },
  { label: 'Capacitaciones', to: '/trainings', roles: ['gerente', 'capacitador'] },
  { label: 'Vencimientos', to: '/compliance', roles: ['gerente', 'capacitador'] },
  { label: 'Reporte YPF', to: '/reports', roles: ['gerente', 'capacitador'] },
];
