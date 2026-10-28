/**
 * components/ui/Button.tsx — Botón base.
 * Módulo: Setup.
 *
 * `loading` muestra un spinner y deshabilita el botón (evita el doble envío); el texto de `children` se mantiene.
 */

import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

export function Button({ variant = 'primary', loading = false, className = '', disabled, children, ...rest }: Props) {
  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ' +
        'disabled:cursor-not-allowed disabled:opacity-50 ' +
        VARIANTS[variant] +
        ' ' +
        className
      }
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
