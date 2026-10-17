/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlan, upsertPlan, copyPlan, listActiveTopicOptions, getExpectedAttendees } from './api';

const KEY = ['plan'] as const;

export function useGetPlan(...args: Parameters<typeof getPlan>) {
  return useQuery({
    queryKey: [...KEY, 'getPlan', ...args],
    queryFn: () => getPlan(...args),
  });
}

export function useActiveTopicOptions(enabled = true) {
  return useQuery({
    // Bajo la clave de temas (M4): si se crea o desactiva un tema, se refresca también acá.
    queryKey: ['topics', 'activeTopicOptions'],
    queryFn: listActiveTopicOptions,
    enabled,
  });
}

export function useExpectedAttendees(topicId: string | null) {
  return useQuery({
    queryKey: [...KEY, 'expectedAttendees', topicId],
    queryFn: () => getExpectedAttendees(topicId as string),
    enabled: Boolean(topicId),
  });
}

function useInvalidatePlan() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useUpsertPlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: (args: Parameters<typeof upsertPlan>) => upsertPlan(...args),
    // También si falla: upsertPlan puede fallar después de haber creado el plan o borrado temas (ver api.ts).
    onSettled: invalidate,
  });
}

export function useCopyPlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: (args: Parameters<typeof copyPlan>) => copyPlan(...args),
    onSettled: invalidate,
  });
}
