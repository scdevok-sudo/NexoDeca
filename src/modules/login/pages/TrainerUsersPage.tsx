/**
 * pages/TrainerUsersPage.tsx — Alta de cuentas de Capacitador.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - TODO(consultar a Santi): la spec no define esta pantalla; es el mínimo para cumplir "el Gerente crea cuentas".
 *  - Ruta: /trainers · roles: gerente
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: gerente (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(consultar a Santi): la spec no define esta pantalla; es el mínimo para cumplir "el Gerente crea cuentas".
export function TrainerUsersPage() {
  return (
    <Placeholder
      code="M1"
      module="Login y sesiones"
      title="TrainerUsersPage"
      route="/trainers"
      roles="gerente"
    />
  );
}
