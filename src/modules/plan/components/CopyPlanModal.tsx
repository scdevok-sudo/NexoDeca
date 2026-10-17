/**
 * components/CopyPlanModal.tsx — Copiar el plan de otro año.
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 *
 * Qué tiene que hacer:
 *  - Confirmar si el año destino ya tiene plan: si tiene temas, se avisa que se reemplazan y el botón lo dice.
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useCopyPlan } from '../hooks';
import type { CopyPlanResult } from '../types';

interface Props {
  open: boolean;
  /** Año destino (el que se está viendo). */
  year: number;
  /** Si el año destino ya tiene temas: copiar los reemplaza (previa confirmación). */
  hasTopics: boolean;
  onClose: () => void;
}

export function CopyPlanModal({ open, year, hasTopics, onClose }: Props) {
  const copy = useCopyPlan();
  const [source, setSource] = useState(String(year - 1));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopyPlanResult | null>(null);

  const close = () => {
    setError(null);
    setResult(null);
    setSource(String(year - 1));
    onClose();
  };

  const submit = async () => {
    setError(null);
    try {
      setResult(await copy.mutateAsync([year, Number(source), { reemplazar: hasTopics }]));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={open} title={`Copiar plan a ${year}`} onClose={close}>
      {result ? (
        <div className="space-y-3 text-sm text-slate-700">
          <p>El plan de {source} se copió a {year}. Ahora podés ajustarlo.</p>
          {result.temasOmitidos.length > 0 && (
            <p>
              No se copiaron por estar inactivos: <strong>{result.temasOmitidos.join(', ')}</strong>.
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={close}>Listo</Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <p className="text-sm text-slate-700">
            Se copian los temas de cada mes como punto de partida. El año de origen no se modifica, y los temas que hoy
            están inactivos no se copian.
          </p>
          {hasTopics && (
            <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              {year} ya tiene temas planificados: se van a <strong>reemplazar</strong> por los del año que elijas.
            </p>
          )}
          <Input
            label="Copiar desde el año"
            type="number"
            inputMode="numeric"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button type="button" variant="secondary" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" variant={hasTopics ? 'danger' : 'primary'} disabled={copy.isPending || !source}>
              {copy.isPending ? 'Copiando…' : hasTopics ? 'Copiar y reemplazar' : 'Copiar'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
