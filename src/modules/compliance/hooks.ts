/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { getUpcomingCompliance } from './api';

// TODO(M8): invalidar/actualizar el cache de react-query donde corresponda.
export function useGetUpcomingCompliance(...args: Parameters<typeof getUpcomingCompliance>) {
  return useQuery({
    queryKey: ['compliance', 'getUpcomingCompliance', ...args],
    queryFn: () => getUpcomingCompliance(...args),
  });
}
