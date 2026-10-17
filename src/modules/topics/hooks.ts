/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listTopics, createTopic, updateTopic, deactivateTopic } from './api';

const KEY = ['topics'] as const;

export function useListTopics(...args: Parameters<typeof listTopics>) {
  return useQuery({
    queryKey: [...KEY, 'listTopics', ...args],
    queryFn: () => listTopics(...args),
    // Mantiene la página anterior visible mientras carga la siguiente.
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTopics() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateTopic() {
  const invalidate = useInvalidateTopics();
  return useMutation({
    mutationFn: (args: Parameters<typeof createTopic>) => createTopic(...args),
    // Se invalida también si falla: createTopic puede fallar después de crear el tema (ver api.ts).
    onSettled: invalidate,
  });
}

export function useUpdateTopic() {
  const invalidate = useInvalidateTopics();
  return useMutation({
    mutationFn: (args: Parameters<typeof updateTopic>) => updateTopic(...args),
    onSettled: invalidate,
  });
}

export function useDeactivateTopic() {
  const invalidate = useInvalidateTopics();
  return useMutation({
    mutationFn: (args: Parameters<typeof deactivateTopic>) => deactivateTopic(...args),
    onSuccess: invalidate,
  });
}
