/**
 * components/TopicsTable.tsx — Listado paginado de temas.
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 *
 * Qué tiene que hacer:
 *  - Badge de tipo y estado.
 */

import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, type Column } from '../../../components/ui/Table';
import type { TrainingTopic } from '../types';

interface Props {
  rows: TrainingTopic[];
  /** id de puesto → nombre, para mostrar los puestos del tema. */
  positionNames: Map<string, string>;
  /** PERMISOS: solo el Gerente ve las acciones (la verificación real es de RLS). */
  canEdit: boolean;
  onEdit: (topic: TrainingTopic) => void;
  onDeactivate: (topic: TrainingTopic) => void;
}

export function TopicsTable({ rows, positionNames, canEdit, onEdit, onDeactivate }: Props) {
  const columns: Column<TrainingTopic>[] = [
    { header: 'Tema', render: (t) => <span className="font-medium text-slate-900">{t.nombre}</span> },
    {
      header: 'Tipo',
      render: (t) => (
        <Badge tone={t.tipo === 'obligatorio' ? 'warning' : 'neutral'}>
          {t.tipo === 'obligatorio' ? 'Obligatorio' : 'Electivo'}
        </Badge>
      ),
    },
    {
      header: 'Puestos',
      render: (t) =>
        t.puestoIds.length === 0
          ? 'Sin puestos'
          : t.puestoIds.map((id) => positionNames.get(id) ?? '—').join(', '),
    },
    {
      header: 'Vence cada',
      render: (t) => (t.periodicidadMeses === null ? 'No vence' : `${t.periodicidadMeses} meses`),
    },
    { header: 'Duración', render: (t) => `${t.duracionHoras} h` },
    {
      header: 'Estado',
      render: (t) => <Badge tone={t.activo ? 'success' : 'neutral'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      header: 'Acciones',
      render: (t) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onEdit(t)}>
            Editar
          </Button>
          {t.activo && (
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onDeactivate(t)}>
              Desactivar
            </Button>
          )}
        </div>
      ),
    });
  }

  return <Table columns={columns} rows={rows} rowKey={(t) => t.id} emptyText="No hay temas con esos filtros" />;
}
