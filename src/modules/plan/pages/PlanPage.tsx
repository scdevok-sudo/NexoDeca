/**
 * pages/PlanPage.tsx — Plan anual de capacitación (año actual por defecto).
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo consulta. Parámetro de año en query string.
 *  - Ruta: /plan · roles: gerente, capacitador
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { CopyPlanModal } from '../components/CopyPlanModal';
import { ExpectedAttendeesPanel } from '../components/ExpectedAttendeesPanel';
import { MES_NOMBRES, PlanMonthColumn } from '../components/PlanMonthColumn';
import { useActiveTopicOptions, useGetPlan, useUpsertPlan } from '../hooks';
import { PLAN_YEAR_MAX, PLAN_YEAR_MIN } from '../schemas';
import type { PlanMonth, PlanMonthEntry, PlanTopic } from '../types';

const MESES: PlanMonth[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function readYear(params: URLSearchParams): number {
  const anio = Number(params.get('anio'));
  return Number.isInteger(anio) && anio >= PLAN_YEAR_MIN && anio <= PLAN_YEAR_MAX ? anio : new Date().getFullYear();
}

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
//   Solo el Gerente arma y modifica el plan; el Capacitador lo consulta para saber qué le toca dictar.
export function PlanPage() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'gerente';
  const [params, setParams] = useSearchParams();
  const year = readYear(params);

  const plan = useGetPlan(year);
  const upsert = useUpsertPlan();
  // null = no se está editando. Mientras se edita, los cambios viven acá hasta "Guardar".
  const [draft, setDraft] = useState<PlanMonthEntry[] | null>(null);
  const topicOptions = useActiveTopicOptions(canEdit && draft !== null);
  const [copying, setCopying] = useState(false);
  const [selected, setSelected] = useState<{ topic: PlanTopic; mes: PlanMonth } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const goToYear = (y: number) => setParams(y === new Date().getFullYear() ? {} : { anio: String(y) });

  const startEdit = () => {
    setSaveError(null);
    setDraft(plan.data?.meses ?? MESES.map((mes) => ({ mes, topics: [] })));
  };

  const updateMonth = (mes: PlanMonth, fn: (topics: PlanTopic[]) => PlanTopic[]) =>
    setDraft((d) => d && d.map((m) => (m.mes === mes ? { ...m, topics: fn(m.topics) } : m)));

  const save = async () => {
    if (!draft) return;
    setSaveError(null);
    try {
      await upsert.mutateAsync([year, { meses: draft.map((m) => ({ mes: m.mes, topicIds: m.topics.map((t) => t.id) })) }]);
      setDraft(null);
    } catch (err) {
      setSaveError(errorMessage(err));
    }
  };

  const editing = draft !== null;
  const meses = draft ?? plan.data?.meses;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Plan anual</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              className="px-2 py-1"
              aria-label="Año anterior"
              disabled={editing || year <= PLAN_YEAR_MIN}
              onClick={() => goToYear(year - 1)}
            >
              ‹
            </Button>
            <span className="w-14 text-center text-lg font-semibold text-slate-900">{year}</span>
            <Button
              variant="secondary"
              className="px-2 py-1"
              aria-label="Año siguiente"
              disabled={editing || year >= PLAN_YEAR_MAX}
              onClick={() => goToYear(year + 1)}
            >
              ›
            </Button>
          </div>
        </div>

        {canEdit && !plan.isLoading && !plan.isError && (
          <div className="flex flex-col gap-2 md:flex-row">
            {editing ? (
              <>
                <Button variant="secondary" onClick={() => setDraft(null)} disabled={upsert.isPending}>
                  Cancelar
                </Button>
                <Button onClick={() => void save()} disabled={upsert.isPending}>
                  {upsert.isPending ? 'Guardando…' : 'Guardar plan'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setCopying(true)}>
                  Copiar de otro año
                </Button>
                <Button onClick={startEdit}>{plan.data ? 'Editar plan' : 'Armar plan'}</Button>
              </>
            )}
          </div>
        )}
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}
      {editing && topicOptions.isError && (
        <p role="alert" className="text-sm text-red-600">
          No se pudieron cargar los temas del catálogo: {errorMessage(topicOptions.error)}
        </p>
      )}

      {plan.isLoading ? (
        <EmptyState tone="loading" title="Cargando…" />
      ) : plan.isError ? (
        <EmptyState tone="error" title="No se pudo cargar el plan" description={errorMessage(plan.error)} />
      ) : !meses ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
            title={`Todavía no hay plan para ${year}`}
            description={canEdit ? 'Armalo desde cero o copiá el de otro año como punto de partida.' : undefined}
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">Hacé clic en un tema para ver quién debería tomarlo.</p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {meses.map((entry) => (
              <PlanMonthColumn
                key={entry.mes}
                entry={entry}
                onSelectTopic={(topic) => setSelected({ topic, mes: entry.mes })}
                edit={
                  editing
                    ? {
                        options: topicOptions.data ?? [],
                        onAdd: (t) =>
                          updateMonth(entry.mes, (ts) => [...ts, t].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
                        onRemove: (id) => updateMonth(entry.mes, (ts) => ts.filter((t) => t.id !== id)),
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(selected)}
        title={selected ? `${selected.topic.nombre} · ${MES_NOMBRES[selected.mes - 1]}` : ''}
        onClose={() => setSelected(null)}
      >
        {selected && <ExpectedAttendeesPanel topic={selected.topic} />}
      </Modal>

      {canEdit && (
        <CopyPlanModal
          key={year}
          open={copying}
          year={year}
          hasTopics={Boolean(plan.data?.meses.some((m) => m.topics.length > 0))}
          onClose={() => setCopying(false)}
        />
      )}
    </section>
  );
}
