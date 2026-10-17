/**
 * components/CertificateList.tsx — Listado de certificados con botón de descarga.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Reutilizable en la vista pública y en la interna.
 */

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type Column } from '../../../components/ui/Table';
import type { CertificateStatus } from '../types';

export interface CertificateListItem {
  id: string;
  temaNombre: string;
  fecha: string;
  nroRegistro: number;
  /** Solo en la vista interna (la pública muestra únicamente vigentes). */
  estado?: CertificateStatus;
  /** Vista pública: URL firmada lista para descargar. */
  downloadUrl?: string;
}

interface Props {
  items: CertificateListItem[];
  /** Vista interna: pide la URL firmada al hacer clic. */
  onDownload?: (id: string) => void;
  downloadingId?: string | null;
  emptyText?: string;
}

/** AAAA-MM-DD → DD/MM/AAAA sin pasar por Date (evita corrimientos de zona horaria). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

const ESTADOS: Record<CertificateStatus, { label: string; tone: 'success' | 'neutral' | 'danger' }> = {
  vigente: { label: 'Vigente', tone: 'success' },
  reemplazado: { label: 'Reemplazado', tone: 'neutral' },
  anulado: { label: 'Anulado', tone: 'danger' },
};

export function CertificateList({ items, onDownload, downloadingId, emptyText = 'No hay certificados' }: Props) {
  const columns: Column<CertificateListItem>[] = [
    { header: 'Tema', render: (c) => <span className="font-medium text-slate-900">{c.temaNombre}</span> },
    { header: 'Fecha', render: (c) => formatDate(c.fecha) },
    { header: 'Nro. registro', render: (c) => c.nroRegistro },
  ];
  if (items.some((c) => c.estado)) {
    columns.push({
      header: 'Estado',
      render: (c) => (c.estado ? <Badge tone={ESTADOS[c.estado].tone}>{ESTADOS[c.estado].label}</Badge> : null),
    });
  }
  columns.push({
    header: 'PDF',
    render: (c) =>
      c.downloadUrl ? (
        <a
          href={c.downloadUrl}
          className="inline-block rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          Descargar
        </a>
      ) : onDownload ? (
        <Button
          variant="secondary"
          className="px-2 py-1 text-xs"
          disabled={downloadingId === c.id}
          onClick={() => onDownload(c.id)}
        >
          {downloadingId === c.id ? 'Preparando…' : 'Descargar'}
        </Button>
      ) : null,
  });

  return <Table columns={columns} rows={items} rowKey={(c) => c.id} emptyText={emptyText} />;
}
