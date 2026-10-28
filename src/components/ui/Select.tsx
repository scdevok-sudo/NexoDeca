/**
 * components/ui/Select.tsx — Desplegable con label y error.
 * Módulo: Setup.
 *
 * TODO(SETUP): versión multi-select (la necesita M4 para los puestos de un tema).
 */

import type { ComponentProps } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props extends ComponentProps<'select'> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({ label, error, options, className = '', ...rest }: Props) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <select
        className={
          'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500 ' +
          className
        }
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
