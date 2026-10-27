/**
 * pages/CertificateVerifyPage.tsx — Verificación pública de un certificado (a donde lleva el QR del PDF).
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Confirmar autenticidad: nombre, tema, fecha, nro de registro, vigencia y estado. Sin DNI ni descarga.
 *  - Ruta: /certificado/:id · roles: público (fuera del AppShell)
 */

import { useParams } from 'react-router-dom';
import { errorMessage } from '../../../lib/apiError';
import { useVerifyCertificate } from '../hooks';
import type { VerifyStatus } from '../types';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const ESTADO: Record<VerifyStatus, { texto: string; clase: string }> = {
  vigente: { texto: 'Certificado auténtico y vigente', clase: 'bg-green-100 text-green-800' },
  vencido: { texto: 'Certificado auténtico, pero vencido', clase: 'bg-amber-100 text-amber-800' },
  anulado: { texto: 'Certificado anulado: ya no es válido', clase: 'bg-red-100 text-red-800' },
};

// PERMISOS: público, sin login. La Edge Function certificate-verify decide qué se devuelve (datos mínimos).
// REGLA DE NEGOCIO: un id inexistente o mal formado muestra el mismo mensaje: no se filtra nada.
export function CertificateVerifyPage() {
  const { id = '' } = useParams();
  const verify = useVerifyCertificate(id);
  const cert = verify.data;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-1 text-center">
          <p className="text-sm font-semibold tracking-wide text-slate-500">DECA ELECTROMECÁNICA · NEXORIS</p>
          <h1 className="text-2xl font-semibold text-slate-900">Verificación de certificado</h1>
        </header>

        {verify.isLoading && <p className="text-center text-sm text-slate-600">Verificando…</p>}

        {verify.isError && (
          <p role="alert" className="text-center text-sm text-red-600">
            {errorMessage(verify.error)}
          </p>
        )}

        {verify.isSuccess && !cert && (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-700">
            No encontramos ese certificado. Revisá que el código QR esté completo o consultalo con tu capacitador.
          </p>
        )}

        {cert && (
          <div className="overflow-hidden rounded-lg border-4 border-double border-slate-400 bg-white">
            <p className={'px-4 py-3 text-center text-sm font-semibold ' + ESTADO[cert.estado].clase}>
              {ESTADO[cert.estado].texto}
            </p>
            <div className="space-y-4 p-6 text-center md:p-10">
              <p className="text-sm text-slate-500">Se certifica que</p>
              <p className="text-2xl font-bold text-slate-900 md:text-3xl">{cert.nombreCompleto}</p>
              <p className="text-sm text-slate-500">aprobó la capacitación</p>
              <p className="text-lg font-semibold text-slate-900 md:text-xl">{cert.temaNombre}</p>
              <dl className="grid gap-3 pt-4 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Dictada el</dt>
                  <dd className="font-medium text-slate-900">{formatDate(cert.fecha)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Válido hasta</dt>
                  <dd className="font-medium text-slate-900">{cert.venceEl ? formatDate(cert.venceEl) : 'No vence'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Nro. de registro</dt>
                  <dd className="font-medium text-slate-900">{cert.nroRegistro}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
