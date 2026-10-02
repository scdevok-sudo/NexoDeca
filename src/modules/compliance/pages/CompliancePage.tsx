/**
 * pages/CompliancePage.tsx — Panel de vencimientos.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Sin vista para Operario.
 *  - Ruta: /compliance · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M8): Sin vista para Operario.
export function CompliancePage() {
  return (
    <Placeholder
      code="M8"
      module="Vencimientos y notificaciones"
      title="CompliancePage"
      route="/compliance"
      roles="gerente, capacitador"
    />
  );
}
