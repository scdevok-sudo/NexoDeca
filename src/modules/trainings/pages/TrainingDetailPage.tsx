/**
 * pages/TrainingDetailPage.tsx — Detalle y edición/anulación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Editar solo si es propia y sin certificados.
 *  - Ruta: /trainings/:id · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M6): Editar solo si es propia y sin certificados.
export function TrainingDetailPage() {
  return (
    <Placeholder
      code="M6"
      module="Dictado y Asistencia"
      title="TrainingDetailPage"
      route="/trainings/:id"
      roles="gerente, capacitador"
    />
  );
}
