/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache. Es un panel de solo lectura: no hay mutaciones que invaliden.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getUpcomingCompliance, listExpiringTopics } from './api';

export function useUpcomingCompliance(...args: Parameters<typeof getUpcomingCompliance>) {
  return useQuery({
    queryKey: ['compliance', 'upcoming', ...args],
    queryFn: () => getUpcomingCompliance(...args),
    // Mantiene el resultado anterior visible mientras se recalcula con otros filtros.
    placeholderData: keepPreviousData,
  });
}

export function useExpiringTopics() {
  return useQuery({
    // Bajo la clave de temas (M4): si cambia el catálogo, se refresca también acá.
    queryKey: ['topics', 'expiringTopics'],
    queryFn: listExpiringTopics,
  });
}
