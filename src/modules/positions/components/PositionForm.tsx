/**
 * components/PositionForm.tsx — Alta/edición de puesto.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - react-hook-form + positionSchema.
 */

// TODO(M3): react-hook-form + positionSchema.

/**
 * components/PositionForm.tsx — Alta/edición de puesto.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * PERMISOS: solo lo renderiza el Gerente; igual RLS rechaza la escritura de cualquier otro rol.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { positionSchema, type PositionFormValues } from '../schemas';
import { useCreatePosition, useUpdatePosition } from '../hooks';
import type { Position } from '../types';

interface Props {
  /** Si viene, es edición. */
  position?: Position;
  onSaved: (position: Position) => void;
  onCancel: () => void;
}

export function PositionForm({ position, onSaved, onCancel }: Props) {
  const isEdit = Boolean(position);
  const create = useCreatePosition();
  const update = useUpdatePosition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PositionFormValues>({
    defaultValues: {
      nombre: position?.nombre ?? '',
      descripcion: position?.descripcion ?? '',
      activo: position?.activo ?? true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const data = parseForm(positionSchema, values, setError);
    if (!data) return;
    try {
      const saved = position ? await update.mutateAsync([position.id, data]) : await create.mutateAsync([data]);
      onSaved(saved);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="Nombre" maxLength={80} autoComplete="off" error={errors.nombre?.message} {...register('nombre')} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Descripción</span>
        <textarea
          rows={3}
          maxLength={500}
          className="w-full rounded border border-slate-300 px-3 py-2"
          {...register('descripcion')}
        />
        {errors.descripcion?.message && (
          <span className="mt-1 block text-xs text-red-600">{errors.descripcion.message}</span>
        )}
      </label>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('activo')} />
          Activo
        </label>
      )}
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear puesto'}
        </Button>
      </div>
    </form>
  );
}
