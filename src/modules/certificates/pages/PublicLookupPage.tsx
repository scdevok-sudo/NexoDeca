/**
 * pages/PublicLookupPage.tsx — Consulta pública del Operario por DNI (fuera del AppShell).
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - No mostrar menú ni datos de otras personas. Responsive.
 *  - Ruta: /consulta · roles: público
 */

import { errorMessage } from '../../../lib/apiError';
import { CertificateList } from '../components/CertificateList';
import { DniLookupForm } from '../components/DniLookupForm';
import { useLookupByDni } from '../hooks';

// PERMISOS: público, sin login. La Edge Function certificates-by-dni es la que decide qué se devuelve.
// REGLA DE NEGOCIO: un único mensaje si no hay resultados (exista o no el DNI): no confirma ni niega nada.
export function PublicLookupPage() {
  const lookup = useLookupByDni();
  const certificados = lookup.data?.certificados;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-1 text-center">
          <p className="text-sm font-semibold tracking-wide text-slate-500">DECA ELECTROMECÁNICA · NEXORIS</p>
          <h1 className="text-2xl font-semibold text-slate-900">Consultá tus certificados</h1>
          <p className="text-sm text-slate-600">Ingresá tu DNI para ver y descargar los certificados de tus capacitaciones.</p>
        </header>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <DniLookupForm
            loading={lookup.isPending}
            onSubmit={(dni) => {
              lookup.reset();
              lookup.mutate(dni);
            }}
          />
        </div>

        {lookup.isError && (
          <p role="alert" className="text-center text-sm text-red-600">
            {errorMessage(lookup.error)}
          </p>
        )}

        {certificados && (
          <div className="rounded-lg border border-slate-200 bg-white p-2">
            {certificados.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-600">
                No encontramos certificados para ese DNI. Si creés que es un error, consultalo con tu capacitador.
              </p>
            ) : (
              <>
                <p className="px-2 pt-2 text-sm text-slate-600">
                  {certificados.length === 1 ? '1 certificado' : `${certificados.length} certificados`}. Los enlaces de
                  descarga vencen a los 10 minutos: si vencen, volvé a consultar.
                </p>
                <CertificateList items={certificados} />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
