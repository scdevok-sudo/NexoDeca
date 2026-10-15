/**
 * pages/PositionsPage.tsx — ABM de puestos.
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 *
 * Qué tiene que hacer:
 *  - Capacitador: solo consulta.
 *  - Ruta: /positions · roles: gerente, capacitador
 */

// PERMISOS: gerente, capacitador (el guard está en routes/index.tsx; la verificación real es de RLS / Edge Functions).
// TODO(M3): Capacitador: solo consulta.
import { useState } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { DeactivatePosition } from '../components/DeactivatePositions';
import { PositionForm } from '../components/PositionForm';
import { PositionsTable } from '../components/PositionsTable';
import { useListPositions } from '../hooks';
import type { Position } from '../types';

export function PositionsPage() {
  const { user } = useAuth();
  const canEdit = user?.rol === 'gerente';
  const [showInactive, setShowInactive] = useState(false);
  // Se traen todos y se filtra en memoria: es un catálogo chico (decenas de filas).
  const list = useListPositions({ incluirInactivos: true });
  const [editing, setEditing] = useState<Position | 'new' | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Position | null>(null);

  const rows = (list.data ?? []).filter((p) => showInactive || p.activo);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Puestos</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Mostrar inactivos
          </label>
          {canEdit && <Button onClick={() => setEditing('new')}>Nuevo puesto</Button>}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2">
        {list.isLoading ? (
          <EmptyState title="Cargando…" />
        ) : list.isError ? (
          <EmptyState title="No se pudieron cargar los puestos" description={errorMessage(list.error)} />
        ) : (
          <PositionsTable rows={rows} canEdit={canEdit} onEdit={setEditing} onDeactivate={setToDeactivate} />
        )}
      </div>

      {canEdit && (
        <>
          <Modal
            open={editing !== null}
            title={editing === 'new' ? 'Nuevo puesto' : 'Editar puesto'}
            onClose={() => setEditing(null)}
          >
            {editing !== null && (
              <PositionForm
                key={editing === 'new' ? 'new' : editing.id}
                position={editing === 'new' ? undefined : editing}
                onCancel={() => setEditing(null)}
                onSaved={() => setEditing(null)}
              />
            )}
          </Modal>
          <DeactivatePosition position={toDeactivate} onClose={() => setToDeactivate(null)} />
        </>
      )}
    </section>
  );
}