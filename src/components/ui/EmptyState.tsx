/**
 * components/ui/EmptyState.tsx — Estado vacío / mensaje centrado.
 * Módulo: Setup.
 */

interface Props {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <div className="p-8 text-center text-slate-500">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}
