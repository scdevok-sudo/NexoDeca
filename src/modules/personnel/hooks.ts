/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { listPersonnel, createPerson, updatePerson, deactivatePerson, importPersonnel } from './api';

// TODO(M2): invalidar/actualizar el cache de react-query donde corresponda.
export function useListPersonnel(...args: Parameters<typeof listPersonnel>) {
  return useQuery({
    queryKey: ['personnel', 'listPersonnel', ...args],
    queryFn: () => listPersonnel(...args),
  });
}

// TODO(M2): invalidar/actualizar el cache de react-query donde corresponda.
export function useCreatePerson() {
  return useMutation({
    mutationFn: (args: Parameters<typeof createPerson>) => createPerson(...args),
  });
}

// TODO(M2): invalidar/actualizar el cache de react-query donde corresponda.
export function useUpdatePerson() {
  return useMutation({
    mutationFn: (args: Parameters<typeof updatePerson>) => updatePerson(...args),
  });
}

// TODO(M2): invalidar/actualizar el cache de react-query donde corresponda.
export function useDeactivatePerson() {
  return useMutation({
    mutationFn: (args: Parameters<typeof deactivatePerson>) => deactivatePerson(...args),
  });
}

// TODO(M2): invalidar/actualizar el cache de react-query donde corresponda.
export function useImportPersonnel() {
  return useMutation({
    mutationFn: (args: Parameters<typeof importPersonnel>) => importPersonnel(...args),
  });
}
