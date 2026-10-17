/**
 * components/TrainingsTable.tsx — Listado paginado de capacitaciones.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Mostrar estado (anulada) y nro de registro.
 */

import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Table, type Column } from '../../../components/ui/Table';
import type { TrainingListItem } from '../types';

/** AAAA-MM-DD → DD/MM/AAAA sin pasar por Date (evita corrimientos de zona horaria). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

interface Props {
  rows: TrainingListItem[];
  /** El Gerente ve las de todos: se muestra quién la dictó. */
  showTrainer: boolean;
}

export function TrainingsTable({ rows, showTrainer }: Props) {
  const columns: Column<TrainingListItem>[] = [
    {
      header: 'Nro. registro',
      render: (t) => (
        <Link to={`/trainings/${t.id}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">
          {t.nroRegistro}
        </Link>
      ),
    },
    { header: 'Fecha', render: (t) => formatDate(t.fecha) },
    { header: 'Tema', render: (t) => t.topicNombre },
  ];
  if (showTrainer) columns.push({ header: 'Capacitador', render: (t) => t.capacitadorNombre ?? '—' });
  columns.push(
    { header: 'Asistentes', render: (t) => t.cantidadAsistentes },
    {
      header: 'Estado',
      render: (t) =>
        t.estado === 'anulada' ? (
          <Badge tone="danger">Anulada</Badge>
        ) : t.tieneCertificados ? (
          <Badge tone="success">Certificada</Badge>
        ) : (
          <Badge tone="neutral">Activa</Badge>
        ),
    },
  );

  return <Table columns={columns} rows={rows} rowKey={(t) => t.id} emptyText="No hay capacitaciones con esos filtros" />;
}
