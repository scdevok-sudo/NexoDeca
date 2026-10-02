/**
 * components/ui/Table.tsx — Tabla genérica con scroll horizontal en mobile.
 * Módulo: Setup.
 *
 * TODO(SETUP): orden por columna (las tablas de M2 piden orden por apellido/nombre y fecha de ingreso).
 * TODO(SETUP): vista de tarjetas en <767px si el scroll horizontal no alcanza.
 */

import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyText?: string;
}

export function Table<T>({ columns, rows, rowKey, emptyText = 'Sin resultados' }: Props<T>) {
  if (rows.length === 0) return <EmptyState title={emptyText} />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className="px-3 py-2 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-slate-100">
              {columns.map((c) => (
                <td key={c.header} className="px-3 py-2">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
