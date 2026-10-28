/**
 * components/ui/Badge.tsx — Etiqueta de estado (activo/inactivo, obligatorio/electivo, vencida…).
 * Módulo: Setup.
 */

import type { ReactNode } from 'react';

interface Props {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}

const TONES: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
};

export function Badge({ tone = 'neutral', children }: Props) {
  return (
    <span className={'rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ' + TONES[tone]}>{children}</span>
  );
}
