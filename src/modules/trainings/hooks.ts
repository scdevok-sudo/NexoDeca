/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { listTrainings, getTraining, createTraining, updateTraining, voidTraining } from './api';

// TODO(M6): invalidar/actualizar el cache de react-query donde corresponda.
export function useListTrainings(...args: Parameters<typeof listTrainings>) {
  return useQuery({
    queryKey: ['trainings', 'listTrainings', ...args],
    queryFn: () => listTrainings(...args),
  });
}

// TODO(M6): invalidar/actualizar el cache de react-query donde corresponda.
export function useGetTraining(...args: Parameters<typeof getTraining>) {
  return useQuery({
    queryKey: ['trainings', 'getTraining', ...args],
    queryFn: () => getTraining(...args),
  });
}

// TODO(M6): invalidar/actualizar el cache de react-query donde corresponda.
export function useCreateTraining() {
  return useMutation({
    mutationFn: (args: Parameters<typeof createTraining>) => createTraining(...args),
  });
}

// TODO(M6): invalidar/actualizar el cache de react-query donde corresponda.
export function useUpdateTraining() {
  return useMutation({
    mutationFn: (args: Parameters<typeof updateTraining>) => updateTraining(...args),
  });
}

// TODO(M6): invalidar/actualizar el cache de react-query donde corresponda.
export function useVoidTraining() {
  return useMutation({
    mutationFn: (args: Parameters<typeof voidTraining>) => voidTraining(...args),
  });
}
