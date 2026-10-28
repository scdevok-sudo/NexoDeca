/**
 * pages/TrainerUsersPage.tsx — Alta de cuentas de Capacitador.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * - Ruta: /trainers · roles: gerente
 * PERMISOS: gerente (guard en routes/index.tsx; la verificación real está en la Edge Function create-trainer-user).
 * TODO(consultar a Santi): la spec no define esta pantalla; es el mínimo para cumplir "el Gerente crea cuentas".
 */

import { CreateTrainerForm } from '../components/CreateTrainerForm';

export function TrainerUsersPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Capacitadores</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-slate-800">Nueva cuenta</h2>
        <CreateTrainerForm />
      </div>
    </section>
  );
}
