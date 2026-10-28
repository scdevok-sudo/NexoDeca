/**
 * components/ui/EmptyState.tsx — Estado vacío, de carga o de error, centrado.
 * Módulo: Setup.
 *
 * `tone`: 'empty' (default, ícono de bandeja), 'loading' (spinner) o 'error' (ícono de alerta). Texto breve y humano;
 * `action` es opcional (un Button o Link).
 */

import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  tone?: 'empty' | 'loading' | 'error';
  action?: ReactNode;
}

export function EmptyState({ title, description, tone = 'empty', action }: Props) {
  const Icon = tone === 'loading' ? Loader2 : tone === 'error' ? AlertCircle : Inbox;
  return (
    <div
      className="flex flex-col items-center gap-1 px-4 py-10 text-center"
      role={tone === 'error' ? 'alert' : undefined}
    >
      <Icon
        className={
          'mb-2 h-6 w-6 ' +
          (tone === 'error' ? 'text-red-500' : 'text-slate-400') +
          (tone === 'loading' ? ' animate-spin motion-reduce:animate-none' : '')
        }
        aria-hidden="true"
      />
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
