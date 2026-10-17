/**
 * components/PlanMonthColumn.tsx — Un mes con sus temas asignados.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Responsive: en <767px apilar los meses (lo resuelve la grilla de PlanPage: 1 columna en mobile).
 */

import { Badge } from '../../../components/ui/Badge';
import type { PlanMonthEntry, PlanTopic } from '../types';
import { PlanTopicPicker } from './PlanTopicPicker';

export const MES_NOMBRES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface Props {
  entry: PlanMonthEntry;
  /** Al hacer clic en un tema: ver quién debería tomarlo. */
  onSelectTopic: (topic: PlanTopic) => void;
  /** Si viene, el mes está en edición (solo Gerente). */
  edit?: {
    options: { id: string; nombre: string }[];
    onAdd: (topic: PlanTopic) => void;
    onRemove: (topicId: string) => void;
  };
}

export function PlanMonthColumn({ entry, onSelectTopic, edit }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">{MES_NOMBRES[entry.mes - 1]}</h2>

      {entry.topics.length === 0 ? (
        <p className="text-xs text-slate-500">Sin temas planificados</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entry.topics.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-sm">
              <button
                type="button"
                className="min-w-0 truncate text-left text-slate-800 underline-offset-2 hover:underline"
                title="Ver quién debería tomarlo"
                onClick={() => onSelectTopic(t)}
              >
                {t.nombre}
              </button>
              <span className="flex shrink-0 items-center gap-1">
                {!t.activo && <Badge tone="neutral">Inactivo</Badge>}
                {edit && (
                  <button
                    type="button"
                    aria-label={`Quitar ${t.nombre} de ${MES_NOMBRES[entry.mes - 1]}`}
                    className="px-1 text-slate-500 hover:text-red-600"
                    onClick={() => edit.onRemove(t.id)}
                  >
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {edit && (
        <PlanTopicPicker
          options={edit.options}
          excludedIds={entry.topics.map((t) => t.id)}
          onAdd={(t) => edit.onAdd({ ...t, activo: true })}
        />
      )}
    </div>
  );
}
