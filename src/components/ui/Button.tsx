/**
 * components/ui/Button.tsx — Botón base.
 * Módulo: Setup.
 *
 * `loading` muestra un spinner y deshabilita el botón (evita el doble envío); el texto de `children` se mantiene.
 */

import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type ButtonVariant } from './styles';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ variant = 'primary', loading = false, className = '', disabled, children, ...rest }: Props) {
  return (
    <button
      className={buttonClass(variant, className)}
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
