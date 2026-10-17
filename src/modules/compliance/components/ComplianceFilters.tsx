/**
 * components/ComplianceFilters.tsx — Filtros por puesto, tema y rango de días.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Default 15 días. Sincronizar con la URL (lo hace CompliancePage).
 */

import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useListPositions } from '../../positions';
import { useExpiringTopics } from '../hooks';
import { DEFAULT_DIAS } from '../schemas';
import type { ComplianceFilters as Filters } from '../types';

interface FilterValues {
  puestoId: string;
  topicId: string;
  dias: string;
}

interface Props {
  value: Filters;
  onChange: (filters: Filters) => void;
}

export function ComplianceFilters({ value, onChange }: Props) {
  const positions = useListPositions();
  const topics = useExpiringTopics();
  const { register, handleSubmit, reset } = useForm<FilterValues>({
    values: {
      puestoId: value.puestoId ?? '',
      topicId: value.topicId ?? '',
      dias: String(value.dias ?? DEFAULT_DIAS),
    },
  });

  const onSubmit = handleSubmit((v) => {
    const dias = Number(v.dias);
    onChange({
      puestoId: v.puestoId || undefined,
      topicId: v.topicId || undefined,
      // Un valor no numérico vuelve al default; el rango (0-365) lo valida el schema y la RPC.
      dias: v.dias.trim() === '' || Number.isNaN(dias) ? undefined : dias,
    });
  });

  const clear = () => {
    reset();
    onChange({});
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" role="search">
      <Select
        label="Puesto"
        disabled={positions.isLoading || positions.isError}
        options={[{ value: '', label: 'Todos' }].concat((positions.data ?? []).map((p) => ({ value: p.id, label: p.nombre })))}
        {...register('puestoId')}
      />
      <Select
        label="Tema"
        disabled={topics.isLoading || topics.isError}
        options={[{ value: '', label: 'Todos' }].concat((topics.data ?? []).map((t) => ({ value: t.id, label: t.nombre })))}
        {...register('topicId')}
      />
      <Input label="Vencen en los próximos (días)" type="number" inputMode="numeric" min={0} max={365} {...register('dias')} />
      <div className="flex items-end gap-2">
        <Button type="submit" className="flex-1">
          Buscar
        </Button>
        <Button type="button" variant="secondary" onClick={clear}>
          Limpiar
        </Button>
      </div>
    </form>
  );
}
