/**
 * components/VoidTrainingModal.tsx — Confirmación de anulación.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - Bloquear si ya tiene certificado (y el servidor responde 409).
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
      {training?.tieneCertificados ? (
        // REGLA DE NEGOCIO: con certificados no se anula (el servidor también responde 409).
        <p className="text-sm text-slate-700">
          Esta capacitación ya tiene certificados generados y no se puede anular. Si hay un error, corregilo registrando
          una capacitación nueva.
        </p>
      ) : (
        <p className="text-sm text-slate-700">
          La capacitación Nro. <strong>{training?.nroRegistro}</strong> ({training?.topicNombre}) va a quedar anulada.
          No se borra: sigue visible en el historial y su número de registro no se vuelve a usar. Esta acción no se puede
          deshacer.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          {training?.tieneCertificados ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!training?.tieneCertificados && (
          <Button variant="danger" onClick={() => void confirm()} disabled={voidTraining.isPending}>
            Anular
          </Button>
        )}
      </div>
    </Modal>
  );
}
