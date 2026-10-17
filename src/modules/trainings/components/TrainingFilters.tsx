/**
 * components/TrainingFilters.tsx — Filtros por tema, fecha y capacitador.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Sincronizar con la URL (lo hace TrainingsListPage con readFilters / writeFilters).
 */

import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useTopicOptions, useTrainers } from '../hooks';
import type { TrainingFilters as Filters } from '../types';

interface FilterValues {
  topicId: string;
  fechaDesde: string;
  fechaHasta: string;
  capacitadorId: string;
  estado: string;
}

interface Props {
  value: Filters;
  onChange: (filters: Filters) => void;
  /** Solo el Gerente filtra por capacitador (el Capacitador ve solo las propias). */
  showTrainerFilter: boolean;
}

export function TrainingFilters({ value, onChange, showTrainerFilter }: Props) {
  const topics = useTopicOptions();
  const trainers = useTrainers(showTrainerFilter);
  const { register, handleSubmit, reset } = useForm<FilterValues>({
    values: {
      topicId: value.topicId ?? '',
      fechaDesde: value.fechaDesde ?? '',
      fechaHasta: value.fechaHasta ?? '',
      capacitadorId: value.capacitadorId ?? '',
      estado: value.estado ?? '',
    },
  });

  const onSubmit = handleSubmit((v) =>
    onChange({
      topicId: v.topicId || undefined,
      fechaDesde: v.fechaDesde || undefined,
      fechaHasta: v.fechaHasta || undefined,
      capacitadorId: showTrainerFilter ? v.capacitadorId || undefined : undefined,
      estado: v.estado === 'activa' || v.estado === 'anulada' ? v.estado : undefined,
      page: 1,
    }),
  );

  const clear = () => {
    reset();
    onChange({ page: 1 });
  };

  return (
    <form
      onSubmit={onSubmit}
      className={'grid gap-3 md:grid-cols-2 ' + (showTrainerFilter ? 'lg:grid-cols-6' : 'lg:grid-cols-5')}
      role="search"
    >
      <Select
        label="Tema"
        disabled={topics.isLoading || topics.isError}
        // Todos los temas, también los inactivos: se consultan capacitaciones históricas.
        options={[{ value: '', label: 'Todos' }].concat(
          (topics.data ?? []).map((t) => ({ value: t.id, label: t.activo ? t.nombre : t.nombre + ' (inactivo)' })),
        )}
        {...register('topicId')}
      />
      <Input label="Desde" type="date" {...register('fechaDesde')} />
      <Input label="Hasta" type="date" {...register('fechaHasta')} />
      {showTrainerFilter && (
        <Select
          label="Capacitador"
          disabled={trainers.isLoading || trainers.isError}
          options={[{ value: '', label: 'Todos' }].concat(
            (trainers.data ?? []).map((t) => ({ value: t.id, label: t.nombre })),
          )}
          {...register('capacitadorId')}
        />
      )}
      <Select
        label="Estado"
        options={[
          { value: '', label: 'Todas' },
          { value: 'activa', label: 'Activas' },
          { value: 'anulada', label: 'Anuladas' },
        ]}
        {...register('estado')}
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
