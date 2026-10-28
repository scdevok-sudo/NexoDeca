/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateMonthlyReport, listMonthlyReports, getReportDownloadUrl } from './api';

const KEY = ['reports'] as const;

export function useListMonthlyReports() {
  return useQuery({
    queryKey: [...KEY, 'listMonthlyReports'],
    queryFn: listMonthlyReports,
  });
}

/** Genera el reporte (Excel o PDF), lo descarga y refresca el historial (aparece la versión nueva). */
export function useGenerateMonthlyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Parameters<typeof generateMonthlyReport>) => {
      const report = await generateMonthlyReport(...args);
      window.location.assign(report.downloadUrl);
      return report;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Pide la URL firmada y navega a ella: el archivo (Excel o PDF) se descarga como adjunto, sin salir de la pantalla. */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async (id: string) => {
      window.location.assign(await getReportDownloadUrl(id));
    },
  });
}
