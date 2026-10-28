/**
 * components/PersonnelTable.tsx — Tabla paginada con orden por columna.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Usar components/ui/Table y Pagination.
 *  - Ocultar acciones de edición al Capacitador (y reforzar con RLS).
 */

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type Column } from '../../../components/ui/Table';
import type { Person } from '../types';

interface Props {
  rows: Person[];
  canEdit: boolean;
  onDeactivate: (person: Person) => void;
}

/** AAAA-MM-DD → DD/MM/AAAA sin pasar por Date (evita corrimientos de zona horaria). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function PersonnelTable({ rows, canEdit, onDeactivate }: Props) {
  const columns: Column<Person>[] = [
    {
      header: 'Apellido y nombre',
      render: (p) => (
        <span className="font-medium text-slate-900">
          {p.apellido}, {p.nombre}
        </span>
      ),
    },
    { header: 'DNI', render: (p) => p.dni, mono: true },
    { header: 'Puesto', render: (p) => p.puestoNombre ?? 'Sin asignar' },
    { header: 'Ingreso', render: (p) => formatDate(p.fechaIngreso) },
    {
      header: 'Estado',
      render: (p) => <Badge tone={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      header: 'Acciones',
      render: (p) =>
        p.activo ? (
          <Button variant="secondary" className="relative z-10 px-2 py-1 text-xs" onClick={() => onDeactivate(p)}>
            Desactivar
          </Button>
        ) : null,
    });
  }

  return (
    <Table
      columns={columns}
      rows={rows}
      rowKey={(p) => p.id}
      rowHref={(p) => `/personnel/${p.id}`}
      emptyText="No hay personas con esos filtros"
    />
  );
}
