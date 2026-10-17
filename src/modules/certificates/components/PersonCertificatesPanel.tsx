/**
 * components/PersonCertificatesPanel.tsx — Historial de certificados para la ficha de Personal (M2).
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Usa listPersonCertificates; solo Gerente/Capacitador (la ficha de Personal ya es solo para esos roles).
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useDownloadCertificate, useListPersonCertificates } from '../hooks';
import { CertificateList } from './CertificateList';

export function PersonCertificatesPanel({ personId }: { personId: string }) {
  const list = useListPersonCertificates(personId);
  const download = useDownloadCertificate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDownload = async (id: string) => {
    setError(null);
    setDownloadingId(id);
    try {
      await download.mutateAsync(id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  if (list.isLoading) return <EmptyState title="Cargando…" />;
  if (list.isError) return <EmptyState title="No se pudieron cargar los certificados" description={errorMessage(list.error)} />;

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <CertificateList
        items={list.data ?? []}
        onDownload={(id) => void onDownload(id)}
        downloadingId={downloadingId}
        emptyText="Esta persona todavía no tiene certificados"
      />
    </div>
  );
}
