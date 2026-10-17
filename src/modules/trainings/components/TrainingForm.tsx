/**
 * components/TrainingForm.tsx — Formulario de dictado + asistencia.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - react-hook-form + trainingSchema.
 */

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { todayISO, trainingSchema } from '../schemas';
import { useCreateTraining, useTopicOptions, useUpdateTraining } from '../hooks';
import type { TrainingDetail } from '../types';
import { AttendeePicker, type SelectedAttendee } from './AttendeePicker';

/** Lo que maneja el form: la duración como texto (los inputs devuelven string); zod la convierte. */
interface FormValues {
  topicId: string;
  fecha: string;
  duracionHoras: string;
  temario: string;
  asistentes: SelectedAttendee[];
}

interface Props {
  /** Si viene, es edición. */
  training?: TrainingDetail;
  onSaved: (training: TrainingDetail) => void;
  onCancel: () => void;
}

export function TrainingForm({ training, onSaved, onCancel }: Props) {
  const isEdit = Boolean(training);
  const topics = useTopicOptions();
  const create = useCreateTraining();
  const update = useUpdateTraining();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      topicId: training?.topicId ?? '',
      fecha: training?.fecha ?? todayISO(),
      duracionHoras: training?.duracionHoras.toString() ?? '',
      temario: training?.temario ?? '',
      // En edición, cada asistente conserva el puesto que tenía al momento del curso (es lo que usa el servidor).
      asistentes: (training?.asistentes ?? []).map((a) => ({
        id: a.personId,
        personId: a.personId,
        dni: a.dni,
        nombre: a.nombre,
        apellido: a.apellido,
        puestoId: a.puestoIdAlDictar,
        puestoNombre: a.puestoNombreAlDictar,
        resultado: a.resultado,
      })),
    },
  });

  // REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): solo temas activos para lo nuevo. En edición se muestra
  //   también el tema actual aunque se haya desactivado después, para no forzar un cambio.
  const topicId = useWatch({ control, name: 'topicId' });
  const selectableTopics = (topics.data ?? []).filter((t) => t.activo || t.id === training?.topicId);
  const selectedTopic = topics.data?.find((t) => t.id === topicId);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const data = parseForm(trainingSchema, values, setError);
    if (!data) return;
    try {
      const saved = training ? await update.mutateAsync([training.id, data]) : await create.mutateAsync([data]);
      onSaved(saved);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-1">
          <Select
            label="Tema"
            disabled={topics.isLoading}
            options={[{ value: '', label: topics.isLoading ? 'Cargando temas…' : 'Elegí el tema' }].concat(
              selectableTopics.map((t) => ({ value: t.id, label: t.activo ? t.nombre : t.nombre + ' (inactivo)' })),
            )}
            error={errors.topicId?.message ?? (topics.isError ? 'No se pudieron cargar los temas' : undefined)}
            {...register('topicId')}
          />
        </div>
        <Input label="Fecha de dictado" type="date" max={todayISO()} error={errors.fecha?.message} {...register('fecha')} />
        <Input
          label="Duración real (horas)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          error={errors.duracionHoras?.message}
          {...register('duracionHoras')}
        />
        <label className="block text-sm md:col-span-2 lg:col-span-3">
          <span className="mb-1 block font-medium text-slate-700">Temario desarrollado</span>
          <textarea
            className="w-full rounded border border-slate-300 px-3 py-2"
            rows={3}
            maxLength={2000}
            placeholder="Breve descripción de lo que se vio"
            {...register('temario')}
          />
          {errors.temario?.message && <span className="mt-1 block text-xs text-red-600">{errors.temario.message}</span>}
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {!selectedTopic && (
          <p className="mb-3 text-sm text-slate-500">Elegí el tema para ver si a cada persona le correspondía.</p>
        )}
        <Controller
          control={control}
          name="asistentes"
          render={({ field }) => (
            <AttendeePicker
              topic={selectedTopic}
              value={field.value}
              onChange={field.onChange}
              error={errors.asistentes?.message}
            />
          )}
        />
      </div>

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
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar capacitación'}
        </Button>
      </div>
    </form>
  );
}
