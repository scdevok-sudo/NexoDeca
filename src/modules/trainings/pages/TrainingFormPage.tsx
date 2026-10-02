/**
 * pages/TrainingFormPage.tsx — Alta de una capacitación dictada.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - El Gerente no necesita cargarlas (salvo que también sea capacitador).
 *  - Ruta: /trainings/new · roles: capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M6): El Gerente no necesita cargarlas (salvo que también sea capacitador).
export function TrainingFormPage() {
  return (
    <Placeholder
      code="M6"
      module="Dictado y Asistencia"
      title="TrainingFormPage"
      route="/trainings/new"
      roles="capacitador"
    />
  );
}
