/**
 * components/TopicFilters.tsx — Filtros por nombre, tipo y puesto.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Sincronizar con la URL (lo hace TopicsPage con readFilters / writeFilters).
 */

import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useListPositions } from '../../positions';
import type { TopicFilters as Filters } from '../types';

interface FilterValues {
  q: string;
  tipo: string;
  puestoId: string;
}

interface Props {
  value: Filters;
  onChange: (filters: Filters) => void;
}

export function TopicFilters({ value, onChange }: Props) {
  const positions = useListPositions({ incluirInactivos: true });
  const { register, handleSubmit, reset } = useForm<FilterValues>({
    values: {
      q: value.q ?? '',
      tipo: value.tipo ?? '',
      puestoId: value.puestoId ?? '',
    },
  });

  const onSubmit = handleSubmit((v) =>
    onChange({
      q: v.q.trim() || undefined,
      tipo: v.tipo === 'obligatorio' || v.tipo === 'electivo' ? v.tipo : undefined,
      puestoId: v.puestoId || undefined,
      page: 1,
    }),
  );

  const clear = () => {
    reset();
    onChange({ page: 1 });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" role="search">
      <Input label="Nombre del tema" maxLength={100} {...register('q')} />
      <Select
        label="Tipo"
        options={[
          { value: '', label: 'Todos' },
          { value: 'obligatorio', label: 'Obligatorio' },
          { value: 'electivo', label: 'Electivo' },
        ]}
        {...register('tipo')}
      />
      <Select
        label="Puesto"
        // Si no se pueden cargar los puestos el selector queda deshabilitado, sin romper la pantalla.
        disabled={positions.isLoading || positions.isError}
        options={[{ value: '', label: 'Todos' }].concat(
          (positions.data ?? []).map((p) => ({ value: p.id, label: p.activo ? p.nombre : p.nombre + ' (inactivo)' })),
        )}
        {...register('puestoId')}
      />
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
