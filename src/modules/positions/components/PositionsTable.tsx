/**
 * components/PositionsTable.tsx — Listado de puestos con estado.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Badge activo/inactivo.
 */

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type Column } from '../../../components/ui/Table';
import type { Position } from '../types';

interface Props {
  rows: Position[];
  canEdit: boolean;
  onEdit: (position: Position) => void;
  onDeactivate: (position: Position) => void;
}

export function PositionsTable({ rows, canEdit, onEdit, onDeactivate }: Props) {
  const columns: Column<Position>[] = [
    { header: 'Puesto', render: (p) => <span className="font-medium text-slate-900">{p.nombre}</span> },
    { header: 'Descripción', render: (p) => p.descripcion || '—' },
    {
      header: 'Estado',
      render: (p) => <Badge tone={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      header: 'Acciones',
      render: (p) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onEdit(p)}>
            Editar
          </Button>
          {p.activo && (
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onDeactivate(p)}>
              Desactivar
            </Button>
          )}
        </div>
      ),
    });
  }

  return <Table columns={columns} rows={rows} rowKey={(p) => p.id} emptyText="No hay puestos cargados" />;
}
