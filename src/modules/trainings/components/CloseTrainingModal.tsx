/**
 * components/CloseTrainingModal.tsx — Confirmación de "Cerrar y generar certificados".
 * Módulo: M6 · Dictado y Asistencia (spec §6) + M7 · Certificados (spec §7)
 *
 * REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): el cierre es explícito. Genera un certificado por asistente
 *   aprobado y desde ahí la capacitación no se edita (si hay un error, se anula y se registra una nueva).
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useGenerateCertificates } from '../../certificates';
import type { TrainingDetail } from '../types';

interface Props {
  training: TrainingDetail | null;
  onClose: () => void;
}

export function CloseTrainingModal({ training, onClose }: Props) {
  const generate = useGenerateCertificates();
  const [error, setError] = useState<string | null>(null);
  const aprobados = training?.asistentes.filter((a) => a.resultado === 'aprobado').length ?? 0;

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (!training) return;
    setError(null);
    try {
      await generate.mutateAsync(training.id);
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={Boolean(training)} title="Cerrar y generar certificados" onClose={close}>
      <div className="space-y-2 text-sm text-slate-700">
        <p>
          Se va a generar {aprobados === 1 ? '1 certificado' : `${aprobados} certificados`} en PDF, uno por cada asistente
          aprobado de la capacitación Nro. <strong>{training?.nroRegistro}</strong>.
        </p>
        <p className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-900">
          Después de cerrarla <strong>no se va a poder editar</strong>. Revisá antes los asistentes y sus resultados.
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={generate.isPending}>
          Cancelar
        </Button>
        <Button onClick={() => void confirm()} disabled={generate.isPending}>
          {generate.isPending ? 'Generando…' : 'Cerrar y generar'}
        </Button>
      </div>
    </Modal>
  );
}
