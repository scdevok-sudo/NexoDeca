/**
 * pages/LoginPage.tsx — Pantalla de login (fuera del AppShell).
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * - Si ya hay sesión, redirige a la ruta de origen (solo rutas internas) o a la home.
 * - Ruta: /login · roles: público
 */

import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { safeInternalPath } from '../../../lib/forms';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = safeInternalPath((location.state as { from?: unknown } | null)?.from);

  if (loading) return <EmptyState title="Cargando sesión…" />;
  if (user) return <Navigate to={from} replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">SGI · Deca</h1>
        <p className="mb-6 mt-1 text-sm text-slate-600">Ingresá con tu cuenta de Gerente o Capacitador.</p>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Querés ver tus certificados?{' '}
          <Link to="/consulta" className="underline">
            Consultá por DNI
          </Link>
        </p>
      </section>
    </main>
  );
}
