/**
 * pages/TopicsPage.tsx — ABM del catálogo de temas.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo consulta.
 *  - Ruta: /topics · roles: gerente, capacitador
 */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { useListPositions } from '../../positions';
import { TopicFilters } from '../components/TopicFilters';
import { TopicForm } from '../components/TopicForm';
import { TopicsTable } from '../components/TopicsTable';
import { useDeactivateTopic, useListTopics } from '../hooks';
import type { TopicFilters as Filters, TrainingTopic } from '../types';

const TIPOS = ['obligatorio', 'electivo'] as const;

function readFilters(params: URLSearchParams): Filters {
  const tipo = params.get('tipo');
  const page = Number(params.get('page') ?? '1');
  return {
    q: params.get('q') || undefined,
    tipo: TIPOS.find((t) => t === tipo),
    puestoId: params.get('puesto') || undefined,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.puestoId) p.set('puesto', f.puestoId);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
//   Solo el Gerente administra el catálogo; el Capacitador solo consulta (no ve botones de alta ni acciones).
export function TopicsPage() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'gerente';
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  // Memo por el string de la URL: mismo filtro → mismo objeto (no resetea el form ni re-dispara la query).
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);

  const list = useListTopics(filters);
  const positions = useListPositions({ incluirInactivos: true });
  const positionNames = useMemo(
    () => new Map((positions.data ?? []).map((p) => [p.id, p.nombre])),
    [positions.data],
  );

  const deactivate = useDeactivateTopic();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TrainingTopic | null>(null);
  const [toDeactivate, setToDeactivate] = useState<TrainingTopic | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    setActionError(null);
    try {
      await deactivate.mutateAsync([toDeactivate.id]);
      setToDeactivate(null);
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1"><h1 className="text-xl font-semibold text-slate-900">Catálogo de temas</h1><p className="text-sm text-slate-600">Temas de capacitación con su tipo, duración y cada cuánto vencen.</p></div>
        {canEdit && <Button onClick={() => setCreating(true)}>Nuevo tema</Button>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <TopicFilters value={filters} onChange={(f) => setParams(writeFilters(f))} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2">
        {list.isLoading ? (
          <EmptyState tone="loading" title="Cargando…" />
        ) : list.isError ? (
          <EmptyState tone="error" title="No se pudo cargar el catálogo" description={errorMessage(list.error)} />
        ) : (
          <>
            <TopicsTable
              rows={list.data?.data ?? []}
              positionNames={positionNames}
              canEdit={canEdit}
              onEdit={setEditing}
              onDeactivate={(t) => {
                setActionError(null);
                setToDeactivate(t);
              }}
            />
            <Pagination
              page={filters.page}
              total={list.data?.total ?? 0}
              onChange={(page) => setParams(writeFilters({ ...filters, page }))}
            />
          </>
        )}
      </div>

      {canEdit && (
        <>
          <Modal open={creating} title="Nuevo tema" onClose={() => setCreating(false)}>
            <TopicForm onCancel={() => setCreating(false)} onSaved={() => setCreating(false)} />
          </Modal>

          <Modal open={Boolean(editing)} title="Editar tema" onClose={() => setEditing(null)}>
            {editing && (
              // key: si se abre otro tema, el form arranca de cero con sus datos.
              <TopicForm key={editing.id} topic={editing} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} />
            )}
          </Modal>

          <Modal open={Boolean(toDeactivate)} title="Desactivar tema" onClose={() => setToDeactivate(null)}>
            <p className="text-sm text-slate-700">
              «{toDeactivate?.nombre}» no va a poder incorporarse a planes nuevos. Las capacitaciones ya dictadas con
              este tema mantienen su historial, y se puede reactivar editándolo.
            </p>
            {actionError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {actionError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setToDeactivate(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => void confirmDeactivate()} disabled={deactivate.isPending}>
                Desactivar
              </Button>
            </div>
          </Modal>
        </>
      )}
    </section>
  );
}
