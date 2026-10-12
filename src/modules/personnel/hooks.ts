/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listPersonnel, getPerson, createPerson, updatePerson, deactivatePerson, importPersonnel } from './api';

const KEY = ['personnel'] as const;

export function useListPersonnel(...args: Parameters<typeof listPersonnel>) {
  return useQuery({
    queryKey: [...KEY, 'listPersonnel', ...args],
    queryFn: () => listPersonnel(...args),
    // Mantiene la página anterior visible mientras carga la siguiente.
    placeholderData: keepPreviousData,
  });
}

export function useGetPerson(...args: Parameters<typeof getPerson>) {
  return useQuery({
    queryKey: [...KEY, 'getPerson', ...args],
    queryFn: () => getPerson(...args),
    enabled: Boolean(args[0]),
  });
}

function useInvalidatePersonnel() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreatePerson() {
  const invalidate = useInvalidatePersonnel();
  return useMutation({
    mutationFn: (args: Parameters<typeof createPerson>) => createPerson(...args),
    onSuccess: invalidate,
  });
}

export function useUpdatePerson() {
  const invalidate = useInvalidatePersonnel();
  return useMutation({
    mutationFn: (args: Parameters<typeof updatePerson>) => updatePerson(...args),
    onSuccess: invalidate,
  });
}

export function useDeactivatePerson() {
  const invalidate = useInvalidatePersonnel();
  return useMutation({
    mutationFn: (args: Parameters<typeof deactivatePerson>) => deactivatePerson(...args),
    onSuccess: invalidate,
  });
}

export function useImportPersonnel() {
  const invalidate = useInvalidatePersonnel();
  return useMutation({
    mutationFn: (args: Parameters<typeof importPersonnel>) => importPersonnel(...args),
    onSuccess: invalidate,
  });
}