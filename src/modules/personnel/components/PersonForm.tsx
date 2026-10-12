/**
 * components/PersonForm.tsx — Alta/edición de persona.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - react-hook-form + personSchema; selector de puestos activos (M3).
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useListPositions } from '../../positions';
import { personSchema, type PersonFormValues } from '../schemas';
import { useCreatePerson, useUpdatePerson } from '../hooks';
import type { Person } from '../types';

interface Props {
  /** Si viene, es edición. */
  person?: Person;
  onSaved: (person: Person) => void;
  onCancel: () => void;
}

export function PersonForm({ person, onSaved, onCancel }: Props) {
  const isEdit = Boolean(person);
  const positions = useListPositions();
  const create = useCreatePerson();
  const update = useUpdatePerson();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    defaultValues: {
      dni: person?.dni ?? '',
      nombre: person?.nombre ?? '',
      apellido: person?.apellido ?? '',
      puestoId: person?.puestoId ?? '',
      fechaIngreso: person?.fechaIngreso ?? '',
      activo: person?.activo ?? true,
    },
  });

  // REGLA DE NEGOCIO: solo puestos activos para asignar. En edición se muestra el actual aunque esté inactivo,
  // para no forzar un cambio de puesto (el trigger de la base solo valida cuando el puesto cambia).
  const options = [{ value: '', label: 'Seleccioná un puesto' }].concat(
    (positions.data ?? []).map((p) => ({ value: p.id, label: p.nombre })),
  );
  if (person && !options.some((o) => o.value === person.puestoId)) {
    options.push({ value: person.puestoId, label: (person.puestoNombre ?? 'Puesto actual') + ' (inactivo)' });
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const data = parseForm(personSchema, values, setError);
    if (!data) return;
    try {
      const saved = person
        ? await update.mutateAsync([person.id, data])
        : await create.mutateAsync([{ ...data, activo: undefined }]);
      onSaved(saved);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" noValidate>
      <Input label="DNI" inputMode="numeric" autoComplete="off" error={errors.dni?.message} {...register('dni')} />
      <Input label="Fecha de ingreso" type="date" error={errors.fechaIngreso?.message} {...register('fechaIngreso')} />
      <Input label="Nombre" autoComplete="off" error={errors.nombre?.message} {...register('nombre')} />
      <Input label="Apellido" autoComplete="off" error={errors.apellido?.message} {...register('apellido')} />
      <Select
        label="Puesto"
        options={options}
        disabled={positions.isLoading}
        error={errors.puestoId?.message ?? (positions.isError ? 'No se pudieron cargar los puestos' : undefined)}
        {...register('puestoId')}
      />
      {isEdit && (
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" {...register('activo')} />
          Activo
        </label>
      )}
      {serverError && (
        <p role="alert" className="text-sm text-red-600 md:col-span-2">
          {serverError}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 md:col-span-2 md:flex-row md:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear persona'}
        </Button>
      </div>
    </form>
  );
}