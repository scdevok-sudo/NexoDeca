/**
 * pages/PersonnelDetailPage.tsx — Ficha de la persona + historial de certificados.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Embeber PersonCertificatesPanel (M7).
 *  - Ruta: /personnel/:id · roles: gerente, capacitador
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import { ApiError, errorMessage } from '../../../lib/apiError';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PersonCertificatesPanel } from '../../certificates';
import { PersonForm } from '../components/PersonForm';
import { formatDate } from '../components/PersonnelTable';
import { useGetPerson } from '../hooks';

export function PersonnelDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const canEdit = user?.rol === 'gerente';
  const person = useGetPerson(id);
  const [editing, setEditing] = useState(false);

  if (person.isLoading) return <EmptyState tone="loading" title="Cargando…" />;
  if (person.isError || !person.data) {
    const notFound = person.error instanceof ApiError && person.error.status === 404;
    return (
      <div className="text-center">
        <EmptyState title={notFound ? 'La persona no existe' : 'No se pudo cargar la ficha'} description={notFound ? undefined : errorMessage(person.error)} />
        <Link to="/personnel" className="text-sm underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  const p = person.data;
  return (
    <section className="space-y-6">
      <Link to="/personnel" className="text-sm text-slate-600 underline">
        ← Personal
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {editing ? (
          <PersonForm person={p} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
        ) : (
          <>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {p.apellido}, {p.nombre}
                </h1>
                <Badge tone={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              {canEdit && (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <dt className="text-slate-500">DNI</dt>
                <dd>{p.dni}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Puesto actual</dt>
                <dd>{p.puestoNombre ?? 'Sin asignar'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fecha de ingreso</dt>
                <dd>{formatDate(p.fechaIngreso)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-slate-800">Certificados</h2>
        <PersonCertificatesPanel personId={p.id} />
      </div>
    </section>
  );
}