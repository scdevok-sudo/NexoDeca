/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTrainings,
  getTraining,
  createTraining,
  updateTraining,
  voidTraining,
  listTopicOptions,
  searchPersonnel,
  listTrainers,
} from './api';

const KEY = ['trainings'] as const;

export function useListTrainings(...args: Parameters<typeof listTrainings>) {
  return useQuery({
    queryKey: [...KEY, 'listTrainings', ...args],
    queryFn: () => listTrainings(...args),
    // Mantiene la página anterior visible mientras carga la siguiente.
    placeholderData: keepPreviousData,
  });
}

export function useGetTraining(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'getTraining', id],
    queryFn: () => getTraining(id as string),
    enabled: Boolean(id),
  });
}

export function useTopicOptions() {
  return useQuery({
    // Bajo la clave de temas (M4): si cambia el catálogo, se refresca también acá.
    queryKey: ['topics', 'trainingTopicOptions'],
    queryFn: listTopicOptions,
  });
}

export function useSearchPersonnel(opts: Parameters<typeof searchPersonnel>[0]) {
  return useQuery({
    queryKey: ['personnel', 'searchForTraining', opts],
    queryFn: () => searchPersonnel(opts),
    placeholderData: keepPreviousData,
  });
}

export function useTrainers(enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, 'trainers'],
    queryFn: listTrainers,
    enabled,
  });
}

function useInvalidateTrainings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateTraining() {
  const invalidate = useInvalidateTrainings();
  return useMutation({
    mutationFn: (args: Parameters<typeof createTraining>) => createTraining(...args),
    onSuccess: invalidate,
  });
}

export function useUpdateTraining() {
  const invalidate = useInvalidateTrainings();
  return useMutation({
    mutationFn: (args: Parameters<typeof updateTraining>) => updateTraining(...args),
    onSuccess: invalidate,
  });
}

export function useVoidTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Parameters<typeof voidTraining>) => voidTraining(...args),
    // Anular también deja sus certificados en 'anulado' (M7).
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: KEY }), qc.invalidateQueries({ queryKey: ['certificates'] })]),
  });
}
