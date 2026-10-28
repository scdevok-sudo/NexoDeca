/**
 * components/ui/Placeholder.tsx — Cartel de "acá va el módulo" para páginas y componentes stub.
 * Módulo: Setup (lo usan todos los módulos hasta que se implementen).
 *
 * TODO(SETUP): se va a ir quedando sin uso a medida que cada módulo se completa; borrarlo al final.
 */

interface Props {
  /** Código del módulo, ej. "M2". */
  code: string;
  module: string;
  title: string;
  route?: string;
  roles?: string;
  /** true = versión chica para componentes dentro de una página. */
  inline?: boolean;
}

export function Placeholder({ code, module, title, route, roles, inline }: Props) {
  if (inline) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-2 text-sm text-slate-500">
        [{code}] {title}
      </div>
    );
  }
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {code} · {module}
      </p>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">{title}</h1>
      {route && <p className="mt-2 text-sm text-slate-600">Ruta: {route}</p>}
      {roles && <p className="text-sm text-slate-600">Roles: {roles}</p>}
      <p className="mt-3 text-sm text-slate-500">Pantalla pendiente de implementar. Ver la ficha del módulo.</p>
    </section>
  );
}
