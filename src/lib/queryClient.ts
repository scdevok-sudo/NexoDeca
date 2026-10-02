/**
 * lib/queryClient.ts — Cliente de react-query compartido.
 * Módulo: Setup.
 *
 * TODO(SETUP): ajustar staleTime/retry cuando haya datos reales.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    // Sin reintentos mientras los api.ts son stubs que tiran "Not implemented".
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});
