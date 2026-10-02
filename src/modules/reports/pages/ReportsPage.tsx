/**
 * pages/ReportsPage.tsx — Generación y descarga del reporte mensual.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - El Operario no accede.
 *  - Ruta: /reports · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M9): El Operario no accede.
export function ReportsPage() {
  return (
    <Placeholder
      code="M9"
      module="Reporte mensual YPF"
      title="ReportsPage"
      route="/reports"
      roles="gerente, capacitador"
    />
  );
}
