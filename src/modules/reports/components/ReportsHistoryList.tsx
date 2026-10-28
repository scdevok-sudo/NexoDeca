/**
 * components/ReportsHistoryList.tsx — Reportes generados anteriormente.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - Descarga de cada archivo guardado (el archivo tal cual se generó: es lo que se le entregó a YPF).
 */

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type Column } from '../../../components/ui/Table';
import type { MonthlyReport } from '../types';
import { MESES } from './MonthYearPicker';

/** Timestamp ISO → DD/MM/AAAA HH:MM en hora de Argentina. */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  reports: MonthlyReport[];
  onDownload: (id: string) => void;
  downloadingId: string | null;
}

export function ReportsHistoryList({ reports, onDownload, downloadingId }: Props) {
  const columns: Column<MonthlyReport>[] = [
    {
      header: 'Mes',
      render: (r) => <span className="font-medium text-slate-900">{`${MESES[r.month - 1]} ${r.year}`}</span>,
    },
    { header: 'Versión', render: (r) => `v${r.version}` },
    {
      header: 'Formato',
      render: (r) => (
        <Badge tone={r.formato === 'pdf' ? 'danger' : 'success'}>{r.formato === 'pdf' ? 'PDF' : 'Excel'}</Badge>
      ),
    },
    { header: 'Generado', render: (r) => formatDateTime(r.generadoEl) },
    { header: 'Por', render: (r) => r.generadoPor ?? '—' },
    { header: 'Capacitaciones', render: (r) => r.cantidadCapacitaciones, align: 'right', mono: true },
    { header: 'Participantes', render: (r) => r.cantidadParticipantes, align: 'right', mono: true },
    {
      header: 'Archivo',
      render: (r) => (
        <Button
          variant="secondary"
          className="px-2 py-1 text-xs"
          loading={downloadingId === r.id}
          onClick={() => onDownload(r.id)}
        >
          {downloadingId === r.id ? 'Preparando…' : 'Descargar'}
        </Button>
      ),
    },
  ];

  return (
    <Table columns={columns} rows={reports} rowKey={(r) => r.id} emptyText="Todavía no se generó ningún reporte" />
  );
}
