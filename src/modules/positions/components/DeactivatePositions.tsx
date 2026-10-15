/**
 * components/DeactivatePosition.tsx — Confirmación para desactivar un puesto.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Avisa cuántas personas activas lo tienen: siguen con ese puesto, pero no se podrá asignar a nadie más
 * ni a temas nuevos.
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useCountActivePersonnel, useDeletePosition } from '../hooks';
import type { Position } from '../types';

interface Props {
  position: Position | null;
  onClose: () => void;
}

export function DeactivatePosition({ position, onClose }: Props) {
  const count = useCountActivePersonnel(position?.id ?? '');
  const deactivate = useDeletePosition();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (!position) return;
    setError(null);
    try {
      await deactivate.mutateAsync([position.id]);
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={Boolean(position)} title="Desactivar puesto" onClose={close}>
      <div className="space-y-3 text-sm text-slate-700">
        <p>
          <strong>{position?.nombre}</strong> no se va a poder asignar a personal nuevo ni a temas nuevos. Lo ya
          registrado no cambia y se puede reactivar desde Editar.
        </p>
        {count.isLoading ? (
          <p className="text-slate-500">Revisando personal asignado…</p>
        ) : count.data ? (
          <p className="text-amber-700">
            Hay {count.data} {count.data === 1 ? 'persona activa' : 'personas activas'} con este puesto: lo conservan.
          </p>
        ) : null}
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void confirm()} disabled={deactivate.isPending}>
            Desactivar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
