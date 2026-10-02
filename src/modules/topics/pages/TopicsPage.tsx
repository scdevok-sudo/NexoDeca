/**
 * pages/TopicsPage.tsx — ABM del catálogo de temas.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo consulta.
 *  - Ruta: /topics · roles: gerente, capacitador
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M4): Capacitador: solo consulta.
export function TopicsPage() {
  return (
    <Placeholder
      code="M4"
      module="Catálogo de Capacitaciones (Temas)"
      title="TopicsPage"
      route="/topics"
      roles="gerente, capacitador"
    />
  );
}
