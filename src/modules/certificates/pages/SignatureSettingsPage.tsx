/**
 * pages/SignatureSettingsPage.tsx — Firma del Responsable de Seguridad e Higiene en los certificados.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Cargar nombre, cargo y matrícula + una imagen de firma (PNG, fondo transparente recomendado).
 *  - Sin nombre cargado, el certificado deja la línea en blanco para firmar a mano.
 *  - Ruta: /certificate-signature · roles: gerente
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Input';
import { signatureSettingsSchema, type SignatureSettingsFormValues } from '../schemas';
import { useSaveSignatureSettings, useSignatureSettings } from '../hooks';

// PERMISOS: solo Gerente (guard en routes/index.tsx; la verificación real es RLS, 0024).
// REGLA DE NEGOCIO: es una imagen estática, no firma digital. Aplica a los certificados que se generen DESDE AHORA:
//   los PDF ya emitidos son inmutables y no cambian.
export function SignatureSettingsPage() {
  const settings = useSignatureSettings();
  const save = useSaveSignatureSettings();
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<SignatureSettingsFormValues>({ defaultValues: { nombre: '', cargo: '', matricula: '' } });

  useEffect(() => {
    if (settings.data) reset({ nombre: settings.data.nombre, cargo: settings.data.cargo, matricula: settings.data.matricula });
  }, [settings.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSaved(false);
    const data = parseForm(signatureSettingsSchema, values, setError);
    if (!data) return;
    try {
      await save.mutateAsync({ values: data, file });
      setFile(null);
      setSaved(true);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  if (settings.isLoading) return <EmptyState title="Cargando…" />;
  if (settings.isError) return <EmptyState title={errorMessage(settings.error)} />;

  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Firma de los certificados</h1>
      <p className="text-sm text-slate-600">
        Datos del Responsable de Seguridad e Higiene que aparecen en los certificados nuevos. Si dejás el nombre vacío, el
        certificado sale con la línea en blanco para firmar a mano. Los certificados ya emitidos no cambian.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4" noValidate>
        <Input label="Nombre y apellido" error={errors.nombre?.message} {...register('nombre')} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Cargo" error={errors.cargo?.message} {...register('cargo')} />
          <Input label="Matrícula" error={errors.matricula?.message} {...register('matricula')} />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Imagen de la firma (PNG, máx. 512 KB)</span>
          <input
            type="file"
            accept="image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <span className="mt-1 block text-xs text-slate-500">
            {file
              ? `Se va a subir: ${file.name}`
              : settings.data?.firmaPath
                ? 'Ya hay una firma cargada. Subí otra solo si querés reemplazarla.'
                : 'Todavía no hay imagen de firma. Recomendado: fondo transparente.'}
          </span>
        </label>
        <Button type="submit" disabled={save.isPending} className="w-full md:w-auto">
          {save.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
        {saved && <p className="text-sm text-green-700">Guardado. Se aplica a los próximos certificados.</p>}
        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}
      </form>
    </section>
  );
}
