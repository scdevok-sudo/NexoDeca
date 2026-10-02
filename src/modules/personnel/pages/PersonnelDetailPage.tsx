/**
 * pages/PersonnelDetailPage.tsx — Ficha de la persona + historial de certificados.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Embeber PersonCertificatesPanel (M7).
 *  - Ruta: /personnel/:id · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M2): Embeber PersonCertificatesPanel (M7).
export function PersonnelDetailPage() {
  return (
    <Placeholder
      code="M2"
      module="Gestión de Personal"
      title="PersonnelDetailPage"
      route="/personnel/:id"
      roles="gerente, capacitador"
    />
  );
}
