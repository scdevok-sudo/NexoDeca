/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { login, logout, getMe, createTrainerUser } from './api';

// TODO(M1): invalidar/actualizar el cache de react-query donde corresponda.
export function useLogin() {
  return useMutation({
    mutationFn: (args: Parameters<typeof login>) => login(...args),
  });
}

// TODO(M1): invalidar/actualizar el cache de react-query donde corresponda.
export function useLogout() {
  return useMutation({
    mutationFn: (args: Parameters<typeof logout>) => logout(...args),
  });
}

// TODO(M1): invalidar/actualizar el cache de react-query donde corresponda.
export function useGetMe(...args: Parameters<typeof getMe>) {
  return useQuery({
    queryKey: ['login', 'getMe', ...args],
    queryFn: () => getMe(...args),
  });
}

// TODO(M1): invalidar/actualizar el cache de react-query donde corresponda.
export function useCreateTrainerUser() {
  return useMutation({
    mutationFn: (args: Parameters<typeof createTrainerUser>) => createTrainerUser(...args),
  });
}
