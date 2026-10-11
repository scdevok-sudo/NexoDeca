/**
 * components/PersonnelFilters.tsx — Filtros por DNI, nombre, puesto y estado.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Sincronizar con query params de la URL.
 */

import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useListPositions } from '../../positions';
import type { PersonnelFilters as Filters } from '../types';

type FilterValues = Required<Pick<Filters, 'estado' | 'orden'>> & { dni: string; q: string; puestoId: string };

interface Props {
  value: Filters;
  onChange: (filters: Filters) => void;
}

export function PersonnelFilters({ value, onChange }: Props) {
  const positions = useListPositions({ incluirInactivos: true });
  const { register, handleSubmit, reset } = useForm<FilterValues>({
    values: {
      dni: value.dni ?? '',
      q: value.q ?? '',
      puestoId: value.puestoId ?? '',
      estado: value.estado ?? 'activos',
      orden: value.orden ?? 'apellido_nombre',
    },
  });

  const onSubmit = handleSubmit((v) =>
    onChange({
      dni: v.dni.trim() || undefined,
      q: v.q.trim() || undefined,
      puestoId: v.puestoId || undefined,
      estado: v.estado,
      orden: v.orden,
      page: 1,
    }),
  );

  const clear = () => {
    reset();
    onChange({ page: 1 });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3 lg:grid-cols-6" role="search">
      <Input label="DNI" inputMode="numeric" maxLength={10} {...register('dni')} />
      <Input label="Nombre o apellido" maxLength={100} {...register('q')} />
      <Select
        label="Puesto"
        options={[{ value: '', label: 'Todos' }].concat(
          (positions.data ?? []).map((p) => ({ value: p.id, label: p.activo ? p.nombre : p.nombre + ' (inactivo)' })),
        )}
        {...register('puestoId')}
      />
      <Select
        label="Estado"
        options={[
          { value: 'activos', label: 'Activos' },
          { value: 'inactivos', label: 'Inactivos' },
          { value: 'todos', label: 'Todos' },
        ]}
        {...register('estado')}
      />
      <Select
        label="Ordenar por"
        options={[
          { value: 'apellido_nombre', label: 'Apellido y nombre' },
          { value: 'fecha_ingreso', label: 'Fecha de ingreso' },
        ]}
        {...register('orden')}
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
