/**
 * pages/PersonnelListPage.tsx — Listado y búsqueda de personal.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo lectura.
 *  - Ruta: /personnel · roles: gerente, capacitador
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { PersonForm } from '../components/PersonForm';
import { PersonnelFilters } from '../components/PersonnelFilters';
import { PersonnelImportModal } from '../components/PersonnelImportModal';
import { PersonnelTable } from '../components/PersonnelTable';
import { useDeactivatePerson, useListPersonnel } from '../hooks';
import type { Person, PersonnelFilters as Filters } from '../types';

const ESTADOS = ['activos', 'inactivos', 'todos'] as const;
const ORDENES = ['apellido_nombre', 'fecha_ingreso'] as const;

function readFilters(params: URLSearchParams): Filters {
  const estado = params.get('estado');
  const orden = params.get('orden');
  const page = Number(params.get('page') ?? '1');
  return {
    dni: params.get('dni') || undefined,
    q: params.get('q') || undefined,
    puestoId: params.get('puesto') || undefined,
    estado: ESTADOS.find((e) => e === estado),
    orden: ORDENES.find((o) => o === orden),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.dni) p.set('dni', f.dni);
  if (f.q) p.set('q', f.q);
  if (f.puestoId) p.set('puesto', f.puestoId);
  if (f.estado && f.estado !== 'activos') p.set('estado', f.estado);
  if (f.orden && f.orden !== 'apellido_nombre') p.set('orden', f.orden);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

export function PersonnelListPage() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'gerente';
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  // Memo por el string de la URL: mismo filtro → mismo objeto (no resetea el form ni re-dispara la query).
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);

  const list = useListPersonnel(filters);
  const deactivate = useDeactivatePerson();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<Person | null>(null);
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
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Personal</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImporting(true)}>
              Importar CSV
            </Button>
            <Button onClick={() => setCreating(true)}>Nueva persona</Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <PersonnelFilters value={filters} onChange={(f) => setParams(writeFilters(f))} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2">
        {list.isLoading ? (
          <EmptyState title="Cargando…" />
        ) : list.isError ? (
          <EmptyState title="No se pudo cargar el personal" description={errorMessage(list.error)} />
        ) : (
          <>
            <PersonnelTable rows={list.data?.data ?? []} canEdit={canEdit} onDeactivate={setToDeactivate} />
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
          <Modal open={creating} title="Nueva persona" onClose={() => setCreating(false)}>
            <PersonForm
              onCancel={() => setCreating(false)}
              onSaved={(p) => {
                setCreating(false);
                navigate(`/personnel/${p.id}`);
              }}
            />
          </Modal>

          <PersonnelImportModal open={importing} onClose={() => setImporting(false)} />

          <Modal open={Boolean(toDeactivate)} title="Desactivar persona" onClose={() => setToDeactivate(null)}>
            <p className="text-sm text-slate-700">
              {toDeactivate?.apellido}, {toDeactivate?.nombre} no va a poder sumarse a capacitaciones nuevas. Su
              historial sigue visible y se puede reactivar desde su ficha.
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
