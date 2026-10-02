/**
 * pages/PublicLookupPage.tsx — Consulta pública del Operario por DNI (fuera del AppShell).
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - No mostrar menú ni datos de otras personas. Responsive.
 *  - Ruta: /consulta · roles: público
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: público (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M7): No mostrar menú ni datos de otras personas. Responsive.
export function PublicLookupPage() {
  return (
    <Placeholder
      code="M7"
      module="Certificados"
      title="PublicLookupPage"
      route="/consulta"
      roles="público"
    />
  );
}
