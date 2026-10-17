/**
 * pages/TrainingDetailPage.tsx — Detalle y edición/anulación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Editar solo si es propia y sin certificados. Anular: la propia (Capacitador) o cualquiera (Gerente).
 *  - Ruta: /trainings/:id · roles: gerente, capacitador
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Table, type Column } from '../../../components/ui/Table';
import { ApplicabilityBadge } from '../components/ApplicabilityBadge';
import { formatDate } from '../components/TrainingsTable';
import { VoidTrainingModal } from '../components/VoidTrainingModal';
import { useGetTraining } from '../hooks';
import type { TrainingAttendee } from '../types';

const columns: Column<TrainingAttendee>[] = [
  { header: 'Apellido y nombre', render: (a) => `${a.apellido}, ${a.nombre}` },
  { header: 'DNI', render: (a) => a.dni },
  // REGLA DE NEGOCIO: el puesto que tenía al momento del curso, no el actual.
  { header: 'Puesto al dictado', render: (a) => a.puestoNombreAlDictar ?? '—' },
  { header: 'Le correspondía', render: (a) => <ApplicabilityBadge value={a.aplicabilidad} /> },
  {
    header: 'Resultado',
    render: (a) =>
      a.resultado === 'aprobado' ? <Badge tone="success">Aprobado</Badge> : <Badge tone="danger">No aprobado</Badge>,
  },
];

// PERMISOS: gerente, capacitador (guard en routes/index.tsx). Los botones solo mejoran la UX: las RPC de 0019
//   vuelven a verificar todo.
export function TrainingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const training = useGetTraining(id);
  const [voiding, setVoiding] = useState(false);

  const back = (
    <Link to="/trainings" className="text-sm text-slate-500 hover:underline">
      ← Volver al listado
    </Link>
  );

  if (training.isLoading) return <EmptyState title="Cargando…" />;
  if (training.isError || !training.data) {
    return (
      <section className="space-y-4">
        {back}
        <EmptyState title="No se pudo cargar la capacitación" description={errorMessage(training.error)} />
      </section>
    );
  }

  const t = training.data;
  const isOwn = t.capacitadorId === user?.id;
  const editable = t.estado === 'activa' && !t.tieneCertificados;
  const canEdit = isOwn && editable;
  const canVoid = editable && (isOwn || user?.rol === 'gerente');
  const aprobados = t.asistentes.filter((a) => a.resultado === 'aprobado').length;

  return (
    <section className="space-y-4">
      {back}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Capacitación Nro. {t.nroRegistro}</h1>
          {t.estado === 'anulada' && <Badge tone="danger">Anulada</Badge>}
          {t.tieneCertificados && <Badge tone="success">Certificada</Badge>}
        </div>
        {(canEdit || canVoid) && (
          <div className="flex flex-col gap-2 md:flex-row">
            {canVoid && (
              <Button variant="danger" onClick={() => setVoiding(true)}>
                Anular
              </Button>
            )}
            {canEdit && (
              <Link
                to={`/trainings/${t.id}/edit`}
                className="rounded bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
              >
                Editar
              </Link>
            )}
          </div>
        )}
      </div>

      {t.estado === 'anulada' && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          Esta capacitación está anulada. Se conserva en el historial y su número de registro no se reutiliza.
        </p>
      )}

      <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-slate-500">Tema</dt>
          <dd className="font-medium text-slate-900">{t.topicNombre}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Fecha de dictado</dt>
          <dd className="font-medium text-slate-900">{formatDate(t.fecha)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Capacitador</dt>
          <dd className="font-medium text-slate-900">{t.capacitadorNombre ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Duración real</dt>
          <dd className="font-medium text-slate-900">{t.duracionHoras} h</dd>
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <dt className="text-slate-500">Temario desarrollado</dt>
          <dd className="whitespace-pre-line text-slate-900">{t.temario || '—'}</dd>
        </div>
      </dl>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
        <p className="px-2 pt-2 text-sm text-slate-700">
          {t.asistentes.length} {t.asistentes.length === 1 ? 'asistente' : 'asistentes'} · {aprobados}{' '}
          {aprobados === 1 ? 'aprobado' : 'aprobados'}
        </p>
        <Table columns={columns} rows={t.asistentes} rowKey={(a) => a.personId} emptyText="Sin asistentes" />
      </div>

      <VoidTrainingModal training={voiding ? t : null} onClose={() => setVoiding(false)} />
    </section>
  );
}
