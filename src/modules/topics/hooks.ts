/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { listTopics, createTopic, updateTopic, deactivateTopic } from './api';

// TODO(M4): invalidar/actualizar el cache de react-query donde corresponda.
export function useListTopics(...args: Parameters<typeof listTopics>) {
  return useQuery({
    queryKey: ['topics', 'listTopics', ...args],
    queryFn: () => listTopics(...args),
  });
}

// TODO(M4): invalidar/actualizar el cache de react-query donde corresponda.
export function useCreateTopic() {
  return useMutation({
    mutationFn: (args: Parameters<typeof createTopic>) => createTopic(...args),
  });
}

// TODO(M4): invalidar/actualizar el cache de react-query donde corresponda.
export function useUpdateTopic() {
  return useMutation({
    mutationFn: (args: Parameters<typeof updateTopic>) => updateTopic(...args),
  });
}

// TODO(M4): invalidar/actualizar el cache de react-query donde corresponda.
export function useDeactivateTopic() {
  return useMutation({
    mutationFn: (args: Parameters<typeof deactivateTopic>) => deactivateTopic(...args),
  });
}
