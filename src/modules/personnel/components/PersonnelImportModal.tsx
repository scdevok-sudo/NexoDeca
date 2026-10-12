/**
 * components/PersonnelImportModal.tsx — Subida del CSV y visualización del informe.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Mostrar procesados/importados/rechazados con motivo.
 */

import { useState } from 'react';
import { errorMessage } from '../../../lib/apiError';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useImportPersonnel } from '../hooks';
import type { ImportReport } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PersonnelImportModal({ open, onClose }: Props) {
  const importMutation = useImportPersonnel();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setFile(null);
    setReport(null);
    setError(null);
    onClose();
  };

  const upload = async () => {
    if (!file) return;
    setError(null);
    setReport(null);
    try {
      setReport(await importMutation.mutateAsync([file]));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={open} title="Importar personal (CSV)" onClose={close}>
      <div className="space-y-4 text-sm">
        <p className="text-slate-600">
          Columnas: <code>dni, nombre, apellido, puesto, fecha_ingreso</code>. Separador coma o punto y coma. Fecha
          AAAA-MM-DD o DD/MM/AAAA. Máximo 1 MB.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setReport(null);
            setError(null);
          }}
          className="block w-full text-sm"
        />
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        {report && (
          <div role="status" className="space-y-2">
            <p>
              Procesados: <strong>{report.procesados}</strong> · Importados: <strong>{report.importados}</strong> ·
              Rechazados: <strong>{report.rechazados.length}</strong>
            </p>
            {report.rechazados.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded border border-slate-200 p-2">
                {report.rechazados.map((r) => (
                  <li key={r.fila}>
                    Fila {r.fila}: {r.motivo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cerrar
          </Button>
          <Button onClick={() => void upload()} disabled={!file || importMutation.isPending}>
            {importMutation.isPending ? 'Importando…' : 'Importar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}