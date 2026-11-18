/**
 * components/ui/Chip.tsx — Etiqueta con forma propia (rounded-full + borde).
 * Módulo: Setup.
 *
 * REGLA DE NEGOCIO (criterio visual): tres categorías sin mezclar.
 *  - Botón (Button): dispara una acción.   - Link (brand-700): navega, solo donde la posición ya lo comunica.
 *  - Chip: clickeable que no es acción ni navegación (ej: un tema del plan que abre un panel). La forma es la señal.
 * Con `onClick` es accionable (hover, foco, cursor pointer). Sin `onClick` es solo lectura: neutro, sin hover ni foco.
 * Para estados informativos (activo, vencida…) usar Badge, que es el mismo concepto en solo lectura con tono.
 */

import type { ReactNode } from 'react';
import { FOCUS_RING } from './styles';

interface Props {
  children: ReactNode;
  /** Si viene, el chip es accionable. */
  onClick?: () => void;
  title?: string;
  className?: string;
}

const BASE = 'inline-flex max-w-full items-center rounded-full border px-3 py-1 text-sm ';

const ACCIONABLE =
  'cursor-pointer border-slate-200 bg-white text-slate-900 transition-colors duration-150 ' +
  'hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100 motion-reduce:transition-none ' +
  FOCUS_RING;

const SOLO_LECTURA = 'border-transparent bg-slate-100 text-slate-600';

export function Chip({ children, onClick, title, className = '' }: Props) {
  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={BASE + ACCIONABLE + ' ' + className}>
        <span className="truncate">{children}</span>
      </button>
    );
  }
  return (
    <span title={title} className={BASE + SOLO_LECTURA + ' ' + className}>
      <span className="truncate">{children}</span>
    </span>
  );
}
