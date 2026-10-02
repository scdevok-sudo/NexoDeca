/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { listPositions, createPosition, updatePosition, deletePosition } from './api';

// TODO(M3): invalidar/actualizar el cache de react-query donde corresponda.
export function useListPositions(...args: Parameters<typeof listPositions>) {
  return useQuery({
    queryKey: ['positions', 'listPositions', ...args],
    queryFn: () => listPositions(...args),
  });
}

// TODO(M3): invalidar/actualizar el cache de react-query donde corresponda.
export function useCreatePosition() {
  return useMutation({
    mutationFn: (args: Parameters<typeof createPosition>) => createPosition(...args),
  });
}

// TODO(M3): invalidar/actualizar el cache de react-query donde corresponda.
export function useUpdatePosition() {
  return useMutation({
    mutationFn: (args: Parameters<typeof updatePosition>) => updatePosition(...args),
  });
}

// TODO(M3): invalidar/actualizar el cache de react-query donde corresponda.
export function useDeletePosition() {
  return useMutation({
    mutationFn: (args: Parameters<typeof deletePosition>) => deletePosition(...args),
  });
}
