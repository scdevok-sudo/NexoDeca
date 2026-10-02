/**
 * pages/PositionsPage.tsx — ABM de puestos.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo consulta.
 *  - Ruta: /positions · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M3): Capacitador: solo consulta.
export function PositionsPage() {
  return (
    <Placeholder
      code="M3"
      module="Puestos y Tipos de Personal"
      title="PositionsPage"
      route="/positions"
      roles="gerente, capacitador"
    />
  );
}
