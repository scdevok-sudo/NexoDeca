/**
 * pages/TrainingsListPage.tsx — Listado de capacitaciones dictadas.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Visibilidad por rol (ver decisión pendiente).
 *  - Ruta: /trainings · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M6): Visibilidad por rol (ver decisión pendiente).
export function TrainingsListPage() {
  return (
    <Placeholder
      code="M6"
      module="Dictado y Asistencia"
      title="TrainingsListPage"
      route="/trainings"
      roles="gerente, capacitador"
    />
  );
}
