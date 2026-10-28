/**
 * components/ui/Input.tsx — Campo de texto con label y error.
 * Módulo: Setup.
 *
 * TODO(SETUP): usar forwardRef/ref como prop para integrarlo con react-hook-form (register).
 */

import type { ComponentProps } from 'react';

interface Props extends ComponentProps<'input'> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <input
        className={
          'w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500 ' +
          className
        }
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
