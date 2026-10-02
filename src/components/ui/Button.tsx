/**
 * components/ui/Button.tsx — Botón base.
 * Módulo: Setup.
 *
 * TODO(SETUP): variantes definitivas (primario, secundario, peligro) y estado "cargando".
 */

import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  return (
    <button
      className={'rounded px-3 py-2 text-sm font-medium disabled:opacity-50 ' + VARIANTS[variant] + ' ' + className}
      {...rest}
    />
  );
}
