/**
 * pages/TrainingsListPage.tsx — Listado de capacitaciones dictadas.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Visibilidad por rol: Gerente todas, Capacitador las propias (lo resuelve RLS de 0014).
 *  - Ruta: /trainings · roles: gerente, capacitador
 */

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { TrainingFilters } from '../components/TrainingFilters';
import { TrainingsTable } from '../components/TrainingsTable';
import { useListTrainings } from '../hooks';
import type { TrainingFilters as Filters } from '../types';

const ESTADOS = ['activa', 'anulada'] as const;

function readFilters(params: URLSearchParams): Filters {
  const estado = params.get('estado');
  const page = Number(params.get('page') ?? '1');
  return {
    topicId: params.get('tema') || undefined,
    fechaDesde: params.get('desde') || undefined,
    fechaHasta: params.get('hasta') || undefined,
    capacitadorId: params.get('capacitador') || undefined,
    estado: ESTADOS.find((e) => e === estado),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.topicId) p.set('tema', f.topicId);
  if (f.fechaDesde) p.set('desde', f.fechaDesde);
  if (f.fechaHasta) p.set('hasta', f.fechaHasta);
  if (f.capacitadorId) p.set('capacitador', f.capacitadorId);
  if (f.estado) p.set('estado', f.estado);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS).
//   El Gerente ve todas las capacitaciones; el Capacitador, solo las propias (RLS trainings_select_*).
export function TrainingsListPage() {
  const { user } = useAuth();
  const isGerente = user?.rol === 'gerente';
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  // Memo por el string de la URL: mismo filtro → mismo objeto (no resetea el form ni re-dispara la query).
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const list = useListTrainings(filters);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Capacitaciones dictadas</h1>
        <Link
          to="/trainings/new"
          className="rounded bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
        >
          Registrar capacitación
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <TrainingFilters value={filters} onChange={(f) => setParams(writeFilters(f))} showTrainerFilter={isGerente} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2">
        {list.isLoading ? (
          <EmptyState title="Cargando…" />
        ) : list.isError ? (
          <EmptyState title="No se pudieron cargar las capacitaciones" description={errorMessage(list.error)} />
        ) : (
          <>
            <TrainingsTable rows={list.data?.data ?? []} showTrainer={isGerente} />
            <Pagination
              page={filters.page}
              total={list.data?.total ?? 0}
              onChange={(page) => setParams(writeFilters({ ...filters, page }))}
            />
          </>
        )}
      </div>
    </section>
  );
}
