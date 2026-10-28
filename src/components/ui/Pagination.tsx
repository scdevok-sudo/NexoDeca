/**
 * components/ui/Pagination.tsx — Paginador.
 * Módulo: Setup.
 *
 * REGLA DE NEGOCIO: la paginación es del lado del servidor, de a PAGE_SIZE (25) registros.
 */

import { PAGE_SIZE } from '../../lib/constants';
import { Button } from './Button';

interface Props {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize = PAGE_SIZE, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-2 py-2 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="text-slate-600">
        Página {page} de {pages}
      </span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </div>
  );
}
