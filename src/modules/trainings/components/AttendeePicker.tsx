/**
 * components/AttendeePicker.tsx — Selección de asistentes desde Personal, con filtro por puesto.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Solo activos. Resultado Aprobado/No aprobado por persona.
 */

import { useEffect, useState } from 'react';
import type { AttendanceResult } from '../../../types/common';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useListPositions } from '../../positions';
import { useSearchPersonnel } from '../hooks';
import type { PersonOption, TopicOption } from '../types';
import { ApplicabilityBadge, previewApplicability } from './ApplicabilityBadge';

/** Asistente elegido en el form: los datos de la persona para mostrar + el resultado. */
export interface SelectedAttendee extends PersonOption {
  personId: string;
  resultado: AttendanceResult;
}

interface Props {
  /** Tema elegido en el form: para anticipar si a cada persona le correspondía. */
  topic: TopicOption | undefined;
  value: SelectedAttendee[];
  onChange: (value: SelectedAttendee[]) => void;
  error?: string;
}

export function AttendeePicker({ topic, value, onChange, error }: Props) {
  const [q, setQ] = useState('');
  // Se busca 300 ms después de la última tecla, no con cada una.
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const [puestoId, setPuestoId] = useState('');
  const positions = useListPositions({ incluirInactivos: true });
  // REGLA DE NEGOCIO: solo personas activas (searchPersonnel filtra; el servidor lo vuelve a validar).
  const results = useSearchPersonnel({ q: debouncedQ || undefined, puestoId: puestoId || undefined });
  const elegidos = new Set(value.map((a) => a.personId));

  const add = (p: PersonOption) => {
    if (elegidos.has(p.id)) return;
    const next = [...value, { ...p, personId: p.id, resultado: 'aprobado' as const }];
    onChange(next.sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es')));
  };
  const remove = (id: string) => onChange(value.filter((a) => a.personId !== id));
  const setResultado = (id: string, resultado: AttendanceResult) =>
    onChange(value.map((a) => (a.personId === id ? { ...a, resultado } : a)));

  const noCorresponden = value.filter((a) => previewApplicability(topic, a.puestoId) === 'no_correspondia').length;

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="space-y-2 rounded border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700">Buscar personas activas</p>
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            aria-label="Nombre, apellido o DNI"
            placeholder="Nombre, apellido o DNI"
            maxLength={100}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            aria-label="Puesto"
            value={puestoId}
            onChange={(e) => setPuestoId(e.target.value)}
            disabled={positions.isLoading || positions.isError}
            options={[{ value: '', label: 'Todos los puestos' }].concat(
              (positions.data ?? []).map((p) => ({ value: p.id, label: p.activo ? p.nombre : p.nombre + ' (inactivo)' })),
            )}
          />
        </div>
        {results.isError ? (
          <p className="text-sm text-red-600">No se pudo buscar el personal</p>
        ) : (
          <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
            {(results.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-slate-900">
                    {p.apellido}, {p.nombre}
                  </span>{' '}
                  <span className="text-slate-500">
                    · DNI {p.dni} · {p.puestoNombre ?? 'Sin puesto'}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 px-2 py-1 text-xs"
                  disabled={elegidos.has(p.id)}
                  onClick={() => add(p)}
                >
                  {elegidos.has(p.id) ? 'Agregada' : 'Agregar'}
                </Button>
              </li>
            ))}
            {results.data?.length === 0 && <li className="py-2 text-sm text-slate-500">Sin resultados</li>}
          </ul>
        )}
        {results.data?.length === 30 && (
          <p className="text-xs text-slate-500">Se muestran los primeros 30: afiná la búsqueda para ver más.</p>
        )}
      </div>

      {/* Elegidos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Asistentes ({value.length})</p>
        {noCorresponden > 0 && (
          <p role="status" className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
            A {noCorresponden === 1 ? '1 persona' : `${noCorresponden} personas`} este tema no le correspondía según su
            puesto. Se puede guardar igual: es solo un aviso.
          </p>
        )}
        {value.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no agregaste asistentes.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded border border-slate-200">
            {value.map((a) => {
              const aplic = previewApplicability(topic, a.puestoId);
              return (
                <li key={a.personId} className="flex flex-col gap-2 p-2 text-sm md:flex-row md:items-center md:justify-between">
                  <span className="min-w-0">
                    <span className="font-medium text-slate-900">
                      {a.apellido}, {a.nombre}
                    </span>{' '}
                    <span className="text-slate-500">
                      · DNI {a.dni} · {a.puestoNombre ?? 'Sin puesto'}
                    </span>{' '}
                    {aplic && <ApplicabilityBadge value={aplic} />}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Select
                      aria-label={`Resultado de ${a.apellido}, ${a.nombre}`}
                      className="py-1 text-xs"
                      value={a.resultado}
                      onChange={(e) => setResultado(a.personId, e.target.value as AttendanceResult)}
                      options={[
                        { value: 'aprobado', label: 'Aprobado' },
                        { value: 'no_aprobado', label: 'No aprobado' },
                      ]}
                    />
                    <button
                      type="button"
                      aria-label={`Quitar a ${a.apellido}, ${a.nombre}`}
                      className="px-1 text-slate-500 hover:text-red-600"
                      onClick={() => remove(a.personId)}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {error && <span className="block text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
