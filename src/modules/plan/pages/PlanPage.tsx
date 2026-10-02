/**
 * pages/PlanPage.tsx — Plan anual de capacitación (año actual por defecto).
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo consulta. Parámetro de año en query string.
 *  - Ruta: /plan · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M5): Capacitador: solo consulta. Parámetro de año en query string.
export function PlanPage() {
  return (
    <Placeholder
      code="M5"
      module="Plan Anual de Capacitación"
      title="PlanPage"
      route="/plan"
      roles="gerente, capacitador"
    />
  );
}
