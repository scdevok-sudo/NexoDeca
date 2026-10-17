/**
 * components/DniLookupForm.tsx — Formulario público de DNI.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - react-hook-form + dniLookupSchema. Mensaje genérico si no hay resultados (lo muestra PublicLookupPage).
 */

import { useForm } from 'react-hook-form';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { dniLookupSchema } from '../schemas';

interface Props {
  onSubmit: (dni: string) => void;
  loading: boolean;
}

export function DniLookupForm({ onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<{ dni: string }>({ defaultValues: { dni: '' } });

  const submit = handleSubmit((values) => {
    const data = parseForm(dniLookupSchema, values, setError);
    if (data) onSubmit(data.dni);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row md:items-start" noValidate>
      <div className="flex-1">
        <Input
          aria-label="DNI"
          placeholder="Tu DNI, sin puntos"
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          error={errors.dni?.message}
          {...register('dni')}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Buscando…' : 'Consultar'}
      </Button>
    </form>
  );
}
