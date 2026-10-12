/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M1 · Login y sesiones (spec §1)
 *
 * Login/logout de la app pasan por AuthProvider (signIn/signOut); estos hooks quedan para usos puntuales.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, logout, getMe, createTrainerUser } from './api';

export function useLogin() {
  return useMutation({
    mutationFn: (args: Parameters<typeof login>) => login(...args),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: (args: Parameters<typeof logout>) => logout(...args),
  });
}

export function useGetMe(...args: Parameters<typeof getMe>) {
  return useQuery({
    queryKey: ['login', 'getMe', ...args],
    queryFn: () => getMe(...args),
  });
}

export function useCreateTrainerUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Parameters<typeof createTrainerUser>) => createTrainerUser(...args),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['login'] }),
  });
}
