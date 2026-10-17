/**
 * components/ComplianceTable.tsx — Vencimientos agrupados por tema.
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 *
 * Qué tiene que hacer:
 *  - Badge nunca lo hizo / vencida / por vencer. Agrupado por tema (spec §8).
 */

import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Table, type Column } from '../../../components/ui/Table';
import type { ComplianceItem, ComplianceStatus } from '../types';

/** AAAA-MM-DD → DD/MM/AAAA sin pasar por Date (evita corrimientos de zona horaria). */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

const ESTADOS: Record<ComplianceStatus, { label: string; tone: 'danger' | 'warning' }> = {
  nunca: { label: 'Nunca lo hizo', tone: 'danger' },
  vencida: { label: 'Vencida', tone: 'danger' },
  por_vencer: { label: 'Por vencer', tone: 'warning' },
};

function detalle(i: ComplianceItem): string {
  if (i.diasRestantes === null) return '—';
  if (i.diasRestantes < 0) return `hace ${-i.diasRestantes} ${i.diasRestantes === -1 ? 'día' : 'días'}`;
  if (i.diasRestantes === 0) return 'hoy';
  return `en ${i.diasRestantes} ${i.diasRestantes === 1 ? 'día' : 'días'}`;
}

const columns: Column<ComplianceItem>[] = [
  {
    header: 'Persona',
    render: (i) => (
      <Link to={`/personnel/${i.personId}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">
        {i.personaNombre}
      </Link>
    ),
  },
  { header: 'DNI', render: (i) => i.dni },
  { header: 'Puesto', render: (i) => i.puestoNombre },
  { header: 'Último aprobado', render: (i) => formatDate(i.ultimoAprobado) },
  { header: 'Vence', render: (i) => (i.venceEl ? `${formatDate(i.venceEl)} (${detalle(i)})` : '—') },
  { header: 'Estado', render: (i) => <Badge tone={ESTADOS[i.estado].tone}>{ESTADOS[i.estado].label}</Badge> },
];

export function ComplianceTable({ items }: { items: ComplianceItem[] }) {
  // Agrupado por tema, en el orden en que vienen (la RPC ordena por tema y por urgencia).
  const grupos = new Map<string, { nombre: string; items: ComplianceItem[] }>();
  for (const i of items) {
    const g = grupos.get(i.topicId) ?? { nombre: i.temaNombre, items: [] };
    g.items.push(i);
    grupos.set(i.topicId, g);
  }

  return (
    <div className="space-y-4">
      {[...grupos.entries()].map(([topicId, g]) => (
        <section key={topicId} className="rounded-lg border border-slate-200 bg-white p-2">
          <h2 className="px-2 pt-2 font-medium text-slate-900">
            {g.nombre} <span className="text-sm font-normal text-slate-500">· vence cada {g.items[0].periodicidadMeses} meses · {g.items.length} {g.items.length === 1 ? 'persona' : 'personas'}</span>
          </h2>
          <Table columns={columns} rows={g.items} rowKey={(i) => `${i.personId}-${i.topicId}`} />
        </section>
      ))}
    </div>
  );
}
