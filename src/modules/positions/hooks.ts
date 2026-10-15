/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listPositions, createPosition, updatePosition, deletePosition, countActivePersonnel } from './api';

export function useListPositions(...args: Parameters<typeof listPositions>) {
  return useQuery({
    queryKey: ['positions', 'listPositions', ...args],
    queryFn: () => listPositions(...args),
  });
}

export function useCountActivePersonnel(...args: Parameters<typeof countActivePersonnel>) {
  return useQuery({
    queryKey: ['positions', 'countActivePersonnel', ...args],
    queryFn: () => countActivePersonnel(...args),
    enabled: Boolean(args[0]),
  });
}

function useInvalidatePositions() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['positions'] }),
      qc.invalidateQueries({ queryKey: ['personnel'] }),
    ]);
}

export function useCreatePosition() {
  const invalidate = useInvalidatePositions();
  return useMutation({
    mutationFn: (args: Parameters<typeof createPosition>) => createPosition(...args),
    onSuccess: invalidate,
  });
}

export function useUpdatePosition() {
  const invalidate = useInvalidatePositions();
  return useMutation({
    mutationFn: (args: Parameters<typeof updatePosition>) => updatePosition(...args),
    onSuccess: invalidate,
  });
}

export function useDeletePosition() {
  const invalidate = useInvalidatePositions();
  return useMutation({
    mutationFn: (args: Parameters<typeof deletePosition>) => deletePosition(...args),
    onSuccess: invalidate,
  });
}