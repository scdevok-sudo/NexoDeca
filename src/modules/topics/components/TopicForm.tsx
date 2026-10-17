/**
 * components/TopicForm.tsx — Alta/edición de tema.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - react-hook-form + topicSchema; multi-select de puestos.
 */

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useListPositions } from '../../positions';
import { topicSchema } from '../schemas';
import { useCreateTopic, useUpdateTopic } from '../hooks';
import type { TrainingTopic } from '../types';

/** Lo que maneja el form: los números como texto (los inputs devuelven string); zod los convierte. */
interface FormValues {
  nombre: string;
  tipo: string;
  puestoIds: string[];
  periodicidadMeses: string;
  duracionHoras: string;
  activo: boolean;
}

interface Props {
  /** Si viene, es edición. */
  topic?: TrainingTopic;
  onSaved: (topic: TrainingTopic) => void;
  onCancel: () => void;
}

export function TopicForm({ topic, onSaved, onCancel }: Props) {
  const isEdit = Boolean(topic);
  const positions = useListPositions({ incluirInactivos: true });
  const create = useCreateTopic();
  const update = useUpdateTopic();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      nombre: topic?.nombre ?? '',
      tipo: topic?.tipo ?? '',
      puestoIds: topic?.puestoIds ?? [],
      periodicidadMeses: topic?.periodicidadMeses?.toString() ?? '',
      duracionHoras: topic?.duracionHoras.toString() ?? '',
      activo: topic?.activo ?? true,
    },
  });

  // REGLA DE NEGOCIO: solo puestos activos para asignar. En edición se muestran también los inactivos que el tema
  //   ya tiene, para no sacarlos sin que el Gerente se dé cuenta.
  const asignados = new Set(topic?.puestoIds ?? []);
  const options = (positions.data ?? []).filter((p) => p.activo || asignados.has(p.id));

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const data = parseForm(topicSchema, values, setError);
    if (!data) return;
    try {
      const saved = topic ? await update.mutateAsync([topic.id, data]) : await create.mutateAsync([data]);
      onSaved(saved);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" noValidate>
      <div className="md:col-span-2">
        <Input label="Nombre del tema" autoComplete="off" maxLength={150} error={errors.nombre?.message} {...register('nombre')} />
      </div>
      <Select
        label="Tipo"
        options={[
          { value: '', label: 'Seleccioná el tipo' },
          { value: 'obligatorio', label: 'Obligatorio' },
          { value: 'electivo', label: 'Electivo' },
        ]}
        error={errors.tipo?.message}
        {...register('tipo')}
      />
      <Input
        label="Duración estimada (horas)"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.5"
        error={errors.duracionHoras?.message}
        {...register('duracionHoras')}
      />
      <div className="md:col-span-2">
        <Input
          label="Vence cada (meses)"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="Vacío = no vence"
          error={errors.periodicidadMeses?.message}
          {...register('periodicidadMeses')}
        />
      </div>

      <fieldset className="md:col-span-2">
        <legend className="mb-1 text-sm font-medium text-slate-700">Puestos a los que aplica</legend>
        {positions.isLoading ? (
          <p className="text-sm text-slate-500">Cargando puestos…</p>
        ) : positions.isError ? (
          <p className="text-sm text-red-600">No se pudieron cargar los puestos</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-slate-500">No hay puestos activos cargados</p>
        ) : (
          <Controller
            control={control}
            name="puestoIds"
            render={({ field }) => (
              <div className="grid max-h-48 gap-1 overflow-y-auto rounded border border-slate-300 p-2 md:grid-cols-2">
                {options.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value.includes(p.id)}
                      onChange={(e) =>
                        field.onChange(
                          e.target.checked ? [...field.value, p.id] : field.value.filter((id) => id !== p.id),
                        )
                      }
                    />
                    {p.activo ? p.nombre : p.nombre + ' (inactivo)'}
                  </label>
                ))}
              </div>
            )}
          />
        )}
        {errors.puestoIds?.message && <span className="mt-1 block text-xs text-red-600">{errors.puestoIds.message}</span>}
      </fieldset>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
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
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tema'}
        </Button>
      </div>
    </form>
  );
}
