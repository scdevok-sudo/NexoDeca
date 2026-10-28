/**
 * pages/ReportsPage.tsx — Generación y descarga del reporte mensual.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - El Operario no accede (la ruta solo admite gerente y capacitador).
 *  - Ruta: /reports · roles: gerente, capacitador
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MESES, MonthYearPicker } from '../components/MonthYearPicker';
import { ReportsHistoryList } from '../components/ReportsHistoryList';
import type { ReportFormat } from '../types';
import { useDownloadReport, useGenerateMonthlyReport, useListMonthlyReports } from '../hooks';

// PERMISOS: gerente, capacitador (guard en routes/index.tsx; lo verifican RLS y las Edge Functions).
export function ReportsPage() {
  const history = useListMonthlyReports();
  const generate = useGenerateMonthlyReport();
  const download = useDownloadReport();
  const [error, setError] = useState<string | null>(null);

  const onGenerate = (year: number, month: number, formato: ReportFormat) => {
    setError(null);
    generate.mutate([year, month, formato], {
      onError: (err) => setError(errorMessage(err)),
    });
  };

  const onDownload = (id: string) => {
    setError(null);
    download.mutate(id, { onError: (err) => setError(errorMessage(err)) });
  };

  const generado = generate.data;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reporte mensual para YPF</h1>
        <p className="text-sm text-slate-600">
          Capacitaciones del mes (tema, fecha, nro. de registro y capacitador) y la nómina de participantes con su
          resultado, en Excel o PDF. Se puede generar con el mes en curso para revisar antes del cierre. Cada reporte
          queda guardado: generar el mismo mes otra vez crea una versión nueva.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <MonthYearPicker
          onSubmit={onGenerate}
          loadingFormat={generate.isPending ? (generate.variables?.[2] ?? 'xlsx') : null}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {generado && !generate.isPending && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">
          Se generó el reporte de {MESES[generado.month - 1]} {generado.year} (v
          {generado.version}, {generado.formato === 'pdf' ? 'PDF' : 'Excel'}) y empezó la descarga.
        </p>
      )}

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
        <h2 className="px-2 pt-2 font-medium text-slate-800">Reportes generados</h2>
        {history.isLoading ? (
          <EmptyState tone="loading" title="Cargando…" />
        ) : history.isError ? (
          <EmptyState tone="error" title="No se pudo cargar el historial" description={errorMessage(history.error)} />
        ) : (
          <ReportsHistoryList
            reports={history.data ?? []}
            onDownload={onDownload}
            downloadingId={download.isPending ? (download.variables ?? null) : null}
          />
        )}
      </div>
    </section>
  );
}
