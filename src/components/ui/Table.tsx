/**
 * components/ui/Table.tsx — Tabla genérica con scroll horizontal en mobile.
 * Módulo: Setup.
 *
 * Estilo (minimal premium): encabezado chico en slate-500, líneas finas entre filas (sin zebra), hover slate-50,
 * celdas con aire (px-4 py-3). Columnas numéricas con `align: 'right'` (+ `mono` para DNI, horas, cantidades).
 * `rowHref` agrega al final una columna "Ver detalle" visible y hace clickeable toda la fila (stretched-link: un solo
 * link por fila para teclado y lectores de pantalla). Los botones de otras celdas necesitan `relative z-10`.
 *
 * TODO(SETUP): orden por columna (las tablas de M2 piden orden por apellido/nombre y fecha de ingreso).
 * TODO(SETUP): vista de tarjetas en <767px si el scroll horizontal no alcanza.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** Columnas numéricas (horas, cantidades, DNI) a la derecha. */
  align?: 'right';
  /** Fuente monoespaciada para escanear números más fácil. */
  mono?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyText?: string;
  /** Si se pasa, cada fila navega a esa ruta y suma la columna "Ver detalle". */
  rowHref?: (row: T) => string;
  actionLabel?: string;
}

function cellClass<T>(c: Column<T>): string {
  return (c.align === 'right' ? 'text-right ' : '') + (c.mono ? 'font-mono tabular-nums ' : '');
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyText = 'Todavía no hay nada para mostrar',
  rowHref,
  actionLabel = 'Ver detalle',
}: Props<T>) {
  if (rows.length === 0) return <EmptyState title={emptyText} />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={'px-4 py-3 font-medium whitespace-nowrap ' + cellClass(c)}>
                {c.header}
              </th>
            ))}
            {rowHref && (
              <th className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={
                'border-b border-slate-100 transition-colors duration-100 ease-out hover:bg-slate-50 motion-reduce:transition-none' +
                (rowHref ? ' relative cursor-pointer' : '')
              }
            >
              {columns.map((c) => (
                <td key={c.header} className={'px-4 py-3 text-slate-700 ' + cellClass(c)}>
                  {c.render(row)}
                </td>
              ))}
              {rowHref && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    to={rowHref(row)}
                    className="inline-flex items-center gap-1 rounded-md font-medium text-brand-700 after:absolute after:inset-0 after:content-[''] hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-500"
                  >
                    {actionLabel}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
