/**
 * components/VoidTrainingModal.tsx — Confirmación de anulación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Con certificados también se anula (decidido con Lucas, 2026-10-17; void_training de 0020): avisar que sus
 *    certificados quedan anulados. Es la forma de corregir una capacitación certificada (y registrar una nueva).
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useVoidTraining } from '../hooks';
import type { Training } from '../types';

interface Props {
  training: Training | null;
  onClose: () => void;
}

export function VoidTrainingModal({ training, onClose }: Props) {
  const voidTraining = useVoidTraining();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (!training) return;
    setError(null);
    try {
      await voidTraining.mutateAsync([training.id]);
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={Boolean(training)} title="Anular capacitación" onClose={close}>
      <p className="text-sm text-slate-700">
        La capacitación Nro. <strong>{training?.nroRegistro}</strong> ({training?.topicNombre}) va a quedar anulada.
        No se borra: sigue visible en el historial y su número de registro no se vuelve a usar. Esta acción no se puede
        deshacer.
      </p>
      {training?.tieneCertificados && (
        <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
          Ya tiene certificados generados: van a quedar <strong>anulados</strong> y dejan de aparecer en la consulta por
          DNI (los PDF se conservan como histórico). Si había un error, registrá después una capacitación nueva con los
          datos correctos.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={() => void confirm()} disabled={voidTraining.isPending}>
          Anular
        </Button>
      </div>
    </Modal>
  );
}
