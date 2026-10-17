/**
 * pages/CompliancePage.tsx — Panel de vencimientos.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Sin vista para Operario (la ruta solo admite gerente y capacitador).
 *  - Ruta: /compliance · roles: gerente, capacitador
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../../lib/apiError';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ComplianceFilters } from '../components/ComplianceFilters';
import { ComplianceTable } from '../components/ComplianceTable';
import { useUpcomingCompliance } from '../hooks';
import { DEFAULT_DIAS } from '../schemas';
import type { ComplianceFilters as Filters } from '../types';

function readFilters(params: URLSearchParams): Filters {
  const dias = Number(params.get('dias'));
  return {
    puestoId: params.get('puesto') || undefined,
    topicId: params.get('tema') || undefined,
    dias: params.has('dias') && Number.isInteger(dias) ? dias : undefined,
  };
}

function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.puestoId) p.set('puesto', f.puestoId);
  if (f.topicId) p.set('tema', f.topicId);
  if (f.dias !== undefined && f.dias !== DEFAULT_DIAS) p.set('dias', String(f.dias));
  return p;
}

// PERMISOS: gerente, capacitador (guard en routes/index.tsx; lo verifica la RPC compliance_upcoming).
// REGLA DE NEGOCIO: NO hay emails automáticos (fuera de presupuesto, 25/09): avisarle al empleado es manual.
export function CompliancePage() {
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  // Memo por el string de la URL: mismo filtro → mismo objeto (no resetea el form ni re-dispara la query).
  const filters = useMemo(() => readFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const list = useUpcomingCompliance(filters);
  const items = list.data ?? [];
  const dias = filters.dias ?? DEFAULT_DIAS;

  const cuenta = (estado: string) => items.filter((i) => i.estado === estado).length;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Vencimientos</h1>
        <p className="text-sm text-slate-600">
          Capacitaciones obligatorias vencidas, que vencen en los próximos {dias} {dias === 1 ? 'día' : 'días'}, o que la
          persona nunca hizo. Avisarle al empleado es manual (por ejemplo, por WhatsApp).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <ComplianceFilters value={filters} onChange={(f) => setParams(writeFilters(f))} />
      </div>

      {list.isLoading ? (
        <EmptyState title="Calculando…" />
      ) : list.isError ? (
        <EmptyState title="No se pudieron calcular los vencimientos" description={errorMessage(list.error)} />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState title="Todo al día" description="No hay capacitaciones vencidas ni por vencer con esos filtros." />
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Resumen label="Nunca lo hicieron" valor={cuenta('nunca')} />
            <Resumen label="Vencidas" valor={cuenta('vencida')} />
            <Resumen label={`Vencen en ${dias} ${dias === 1 ? 'día' : 'días'}`} valor={cuenta('por_vencer')} />
          </div>
          <ComplianceTable items={items} />
        </>
      )}
    </section>
  );
}

function Resumen({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{valor}</p>
    </div>
  );
}
