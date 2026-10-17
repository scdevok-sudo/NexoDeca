/**
 * components/PlanTopicPicker.tsx — Selector de temas activos del catálogo.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Solo temas activos (M4).
 */

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';

interface Props {
  /** Temas activos del catálogo (useActiveTopicOptions). */
  options: { id: string; nombre: string }[];
  /** Temas que ya están en el mes: no se ofrecen de nuevo. */
  excludedIds: string[];
  onAdd: (topic: { id: string; nombre: string }) => void;
}

export function PlanTopicPicker({ options, excludedIds, onAdd }: Props) {
  const [value, setValue] = useState('');
  const disponibles = options.filter((o) => !excludedIds.includes(o.id));

  const add = () => {
    const topic = disponibles.find((o) => o.id === value);
    if (!topic) return;
    onAdd(topic);
    setValue('');
  };

  if (disponibles.length === 0) {
    return <p className="text-xs text-slate-500">No quedan temas activos para agregar</p>;
  }

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Select
          aria-label="Tema a agregar"
          className="py-1 text-xs"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          options={[{ value: '', label: 'Agregar tema…' }].concat(disponibles.map((o) => ({ value: o.id, label: o.nombre })))}
        />
      </div>
      <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={add} disabled={!value}>
        Agregar
      </Button>
    </div>
  );
}
