/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { generateMonthlyReport, listMonthlyReports } from './api';

// TODO(M9): invalidar/actualizar el cache de react-query donde corresponda.
export function useGenerateMonthlyReport() {
  return useMutation({
    mutationFn: (args: Parameters<typeof generateMonthlyReport>) => generateMonthlyReport(...args),
  });
}

// TODO(M9): invalidar/actualizar el cache de react-query donde corresponda.
export function useListMonthlyReports(...args: Parameters<typeof listMonthlyReports>) {
  return useQuery({
    queryKey: ['reports', 'listMonthlyReports', ...args],
    queryFn: () => listMonthlyReports(...args),
  });
}
