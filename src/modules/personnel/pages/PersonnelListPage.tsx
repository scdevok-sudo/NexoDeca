/**
 * pages/PersonnelListPage.tsx — Listado y búsqueda de personal.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo lectura.
 *  - Ruta: /personnel · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M2): Capacitador: solo lectura.
export function PersonnelListPage() {
  return (
    <Placeholder
      code="M2"
      module="Gestión de Personal"
      title="PersonnelListPage"
      route="/personnel"
      roles="gerente, capacitador"
    />
  );
}
