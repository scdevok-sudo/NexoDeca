/**
 * components/ExpectedAttendeesPanel.tsx — Quién debería tomar cada tema planificado.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Cruzar tema.puestos con el personal activo (lo hace getExpectedAttendees en api.ts).
 */

import { errorMessage } from '../../../lib/apiError';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Table, type Column } from '../../../components/ui/Table';
import { useExpectedAttendees } from '../hooks';
import type { ExpectedAttendee, PlanTopic } from '../types';

interface Props {
  topic: PlanTopic;
}

const columns: Column<ExpectedAttendee>[] = [
  { header: 'Apellido y nombre', render: (p) => `${p.apellido}, ${p.nombre}` },
  { header: 'DNI', render: (p) => p.dni, mono: true },
  { header: 'Puesto', render: (p) => p.puestoNombre ?? 'Sin asignar' },
];

export function ExpectedAttendeesPanel({ topic }: Props) {
  const list = useExpectedAttendees(topic.id);

  if (list.isLoading) return <EmptyState tone="loading" title="Cargando…" />;
  if (list.isError) return <EmptyState tone="error" title="No se pudo calcular" description={errorMessage(list.error)} />;

  const personas = list.data ?? [];
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">
        {personas.length === 0
          ? 'Ninguna persona activa tiene un puesto al que aplique este tema.'
          : `${personas.length} ${personas.length === 1 ? 'persona activa debería' : 'personas activas deberían'} tomarlo, según su puesto actual.`}
      </p>
      {personas.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          <Table columns={columns} rows={personas} rowKey={(p) => p.id} />
        </div>
      )}
    </div>
  );
}
