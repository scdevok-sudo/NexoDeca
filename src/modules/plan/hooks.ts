/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { getPlan, upsertPlan, copyPlan } from './api';

// TODO(M5): invalidar/actualizar el cache de react-query donde corresponda.
export function useGetPlan(...args: Parameters<typeof getPlan>) {
  return useQuery({
    queryKey: ['plan', 'getPlan', ...args],
    queryFn: () => getPlan(...args),
  });
}

// TODO(M5): invalidar/actualizar el cache de react-query donde corresponda.
export function useUpsertPlan() {
  return useMutation({
    mutationFn: (args: Parameters<typeof upsertPlan>) => upsertPlan(...args),
  });
}

// TODO(M5): invalidar/actualizar el cache de react-query donde corresponda.
export function useCopyPlan() {
  return useMutation({
    mutationFn: (args: Parameters<typeof copyPlan>) => copyPlan(...args),
  });
}
