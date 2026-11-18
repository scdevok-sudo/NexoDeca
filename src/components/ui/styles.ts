/**
 * components/ui/styles.ts — Clases compartidas de botones y links (una sola fuente de verdad visual).
 *
 * Criterio: acento único brand-700, color 150ms, presión con scale 0.97 en 160ms ease-out, sin `transition: all`.
 * Los `hover:` están acotados a (hover: hover) and (pointer: fine) en index.css (@custom-variant).
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ' +
  '[transition:color_150ms_ease,background-color_150ms_ease,border-color_150ms_ease,transform_160ms_ease-out] ' +
  'active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ' +
  FOCUS_RING +
  ' disabled:cursor-not-allowed disabled:opacity-50';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
};

/** Clases de un botón; también para un <Link>/<a> que tiene que verse como botón. */
export function buttonClass(variant: ButtonVariant = 'primary', extra = ''): string {
  return BUTTON_BASE + ' ' + BUTTON_VARIANTS[variant] + (extra ? ' ' + extra : '');
}

/** Link de texto (volver, consultá por DNI, etc.). */
export const LINK_CLASS =
  'rounded-sm text-brand-700 underline underline-offset-2 transition-colors duration-150 ' +
  'hover:text-brand-900 active:text-brand-900 motion-reduce:transition-none ' +
  FOCUS_RING;

/** Botón-ícono chico (quitar). `danger` tiñe el hover de rojo para acciones destructivas. */
export function iconButtonClass(danger = false): string {
  return (
    'rounded-md p-1 text-slate-500 transition-colors duration-150 active:bg-slate-200 motion-reduce:transition-none ' +
    (danger ? 'hover:text-red-600 ' : 'hover:bg-slate-100 hover:text-slate-900 ') +
    FOCUS_RING
  );
}

/** Checkbox nativo con el acento de marca (en vez del azul del navegador), tamaño uniforme y foco visible. */
export const CHECKBOX_CLASS =
  'h-4 w-4 shrink-0 cursor-pointer accent-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

/** Textarea con la misma línea que Input. */
export const TEXTAREA_CLASS =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500';
