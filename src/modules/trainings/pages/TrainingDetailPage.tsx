/**
 * pages/TrainingDetailPage.tsx — Detalle, edición, cierre (certificados) y anulación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Editar solo si es propia, activa y sin certificados.
 *  - Cerrar y generar certificados (M7): la propia (Capacitador) o cualquiera (Gerente), con al menos un aprobado.
 *  - Anular: la propia (Capacitador) o cualquiera (Gerente), tenga o no certificados.
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
import { useDownloadCertificate, useTrainingCertificates, type TrainingCertificate } from '../../certificates';
import { ApplicabilityBadge } from '../components/ApplicabilityBadge';
import { CloseTrainingModal } from '../components/CloseTrainingModal';
import { formatDate } from '../components/TrainingsTable';
import { VoidTrainingModal } from '../components/VoidTrainingModal';
import { useGetTraining } from '../hooks';
import type { TrainingAttendee } from '../types';

const baseColumns: Column<TrainingAttendee>[] = [
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

/** Por persona, el certificado a mostrar: el vigente si hay; si no, el más nuevo (vienen ordenados así). */
function certificatesByPerson(certs: TrainingCertificate[]): Map<string, TrainingCertificate> {
  const map = new Map<string, TrainingCertificate>();
  for (const c of certs) {
    const current = map.get(c.personId);
    if (!current || (current.estado !== 'vigente' && c.estado === 'vigente')) map.set(c.personId, c);
  }
  return map;
}

// PERMISOS: gerente, capacitador (guard en routes/index.tsx). Los botones solo mejoran la UX: las RPC de 0019/0020
//   y la Edge Function generate-certificates vuelven a verificar todo.
export function TrainingDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const training = useGetTraining(id);
  const certs = useTrainingCertificates(id, Boolean(training.data?.tieneCertificados));
  const download = useDownloadCertificate();
  const [voiding, setVoiding] = useState(false);
  const [closing, setClosing] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
  const isGerente = user?.rol === 'gerente';
  const aprobados = t.asistentes.filter((a) => a.resultado === 'aprobado').length;
  const activa = t.estado === 'activa';
  const canEdit = isOwn && activa && !t.tieneCertificados;
  const canClose = (isOwn || isGerente) && activa && !t.tieneCertificados && aprobados > 0;
  const canVoid = (isOwn || isGerente) && activa;

  const columns = [...baseColumns];
  if (t.tieneCertificados) {
    const porPersona = certificatesByPerson(certs.data ?? []);
    columns.push({
      header: 'Certificado',
      render: (a) => {
        const c = porPersona.get(a.personId);
        if (!c) return a.resultado === 'aprobado' && certs.isLoading ? '…' : '—';
        return (
          <span className="flex items-center gap-2">
            {c.estado === 'anulado' && <Badge tone="danger">Anulado</Badge>}
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              disabled={download.isPending && download.variables === c.id}
              onClick={() => {
                setDownloadError(null);
                download.mutate(c.id, { onError: (err) => setDownloadError(errorMessage(err)) });
              }}
            >
              {download.isPending && download.variables === c.id ? 'Preparando…' : 'Descargar'}
            </Button>
          </span>
        );
      },
    });
  }

  return (
    <section className="space-y-4">
      {back}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Capacitación Nro. {t.nroRegistro}</h1>
          {t.estado === 'anulada' && <Badge tone="danger">Anulada</Badge>}
          {t.tieneCertificados && <Badge tone="success">Certificada</Badge>}
        </div>
        {(canEdit || canClose || canVoid) && (
          <div className="flex flex-col gap-2 md:flex-row">
            {canVoid && (
              <Button variant="danger" onClick={() => setVoiding(true)}>
                Anular
              </Button>
            )}
            {canEdit && (
              <Link
                to={`/trainings/${t.id}/edit`}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Editar
              </Link>
            )}
            {canClose && <Button onClick={() => setClosing(true)}>Cerrar y generar certificados</Button>}
          </div>
        )}
      </div>

      {t.estado === 'anulada' && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          Esta capacitación está anulada. Se conserva en el historial y su número de registro no se reutiliza.
          {t.tieneCertificados && ' Sus certificados quedaron anulados.'}
        </p>
      )}
      {activa && !t.tieneCertificados && (isOwn || isGerente) && aprobados === 0 && (
        <p className="rounded border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
          No hay asistentes aprobados: no hay certificados para generar.
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
        {downloadError && (
          <p role="alert" className="px-2 text-sm text-red-600">
            {downloadError}
          </p>
        )}
        <Table columns={columns} rows={t.asistentes} rowKey={(a) => a.personId} emptyText="Sin asistentes" />
      </div>

      <VoidTrainingModal training={voiding ? t : null} onClose={() => setVoiding(false)} />
      <CloseTrainingModal training={closing ? t : null} onClose={() => setClosing(false)} />
    </section>
  );
}
