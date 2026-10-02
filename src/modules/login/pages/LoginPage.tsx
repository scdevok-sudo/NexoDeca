/**
 * pages/LoginPage.tsx — Pantalla de login (fuera del AppShell).
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Si ya hay sesión, redirigir a la home.
 *  - Ruta: /login · roles: público
 */

import { Placeholder } from '../../../components/ui/Placeholder';

// PERMISOS: público (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M1): Si ya hay sesión, redirigir a la home.
export function LoginPage() {
  return (
    <Placeholder
      code="M1"
      module="Login y sesiones"
      title="LoginPage"
      route="/login"
      roles="público"
    />
  );
}
