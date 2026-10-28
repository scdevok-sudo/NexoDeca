/**
 * pages/TrainingFormPage.tsx — Alta (y edición) de una capacitación dictada.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - El Gerente no necesita cargarlas, pero puede cargar las propias (decidido con Lucas, 2026-10-17).
 *  - Rutas: /trainings/new y /trainings/:id/edit · roles: gerente, capacitador
 */

import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { EmptyState } from '../../../components/ui/EmptyState';
import { TrainingForm } from '../components/TrainingForm';
import { useGetTraining } from '../hooks';

// PERMISOS: gerente, capacitador (guard en routes/index.tsx). La verificación real la hacen las RPC de 0019:
//   solo quien la cargó la edita, y solo si está activa y sin certificados.
export function TrainingFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const training = useGetTraining(id);
  const backTo = id ? `/trainings/${id}` : '/trainings';

  const header = (title: string) => (
    <div className="flex flex-col gap-1">
      <Link to={backTo} className="text-sm text-slate-500 hover:underline">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
    </div>
  );

  if (!id) {
    return (
      <section className="space-y-6">
        {header('Registrar capacitación')}
        <TrainingForm onCancel={() => navigate(backTo)} onSaved={(t) => navigate(`/trainings/${t.id}`)} />
      </section>
    );
  }

  if (training.isLoading) return <EmptyState tone="loading" title="Cargando…" />;
  if (training.isError || !training.data) {
    return (
      <section className="space-y-6">
        {header('Editar capacitación')}
        <EmptyState tone="error" title="No se pudo cargar la capacitación" description={errorMessage(training.error)} />
      </section>
    );
  }

  const t = training.data;
  const motivo =
    t.capacitadorId !== user?.id
      ? 'Solo quien cargó la capacitación puede editarla.'
      : t.estado === 'anulada'
        ? 'La capacitación está anulada.'
        : t.tieneCertificados
          ? 'La capacitación ya tiene certificados generados. Si hay un error, registrá una capacitación nueva.'
          : null;

  return (
    <section className="space-y-6">
      {header(`Editar capacitación Nro. ${t.nroRegistro}`)}
      {motivo ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState title="No se puede editar" description={motivo} />
        </div>
      ) : (
        <TrainingForm
          key={t.id}
          training={t}
          onCancel={() => navigate(backTo)}
          onSaved={(saved) => navigate(`/trainings/${saved.id}`)}
        />
      )}
    </section>
  );
}
