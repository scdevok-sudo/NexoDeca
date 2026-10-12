/**
 * components/CreateTrainerForm.tsx — Formulario del Gerente para crear Capacitadores.
 *
 * PERMISOS: el rol 'capacitador' lo fija la Edge Function; este form no lo manda.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createTrainerSchema, type CreateTrainerFormValues } from '../schemas';
import { useCreateTrainerUser } from '../hooks';

export function CreateTrainerForm() {
  const create = useCreateTrainerUser();
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTrainerFormValues>({ defaultValues: { email: '', nombre: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setCreated(null);
    const data = parseForm(createTrainerSchema, values, setError);
    if (!data) return;
    try {
      const user = await create.mutateAsync([data]);
      setCreated(user.email);
      reset();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" noValidate>
      <Input label="Nombre y apellido" autoComplete="off" error={errors.nombre?.message} {...register('nombre')} />
      <Input label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
      <Input
        label="Contraseña inicial"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex items-end">
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? 'Creando…' : 'Crear capacitador'}
        </Button>
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-red-600 md:col-span-2">
          {serverError}
        </p>
      )}
      {created && (
        <p role="status" className="text-sm text-green-700 md:col-span-2">
          Cuenta creada para {created}. Pasale la contraseña inicial por un canal privado.
        </p>
      )}
    </form>
  );
}
