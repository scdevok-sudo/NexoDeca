/**
 * components/LoginForm.tsx — Formulario email + contraseña.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../auth/useAuth';
import { errorMessage } from '../../../lib/apiError';
import { parseForm } from '../../../lib/forms';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { loginSchema, type LoginFormValues } from '../schemas';

interface Props {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const data = parseForm(loginSchema, values, setError);
    if (!data) return;
    try {
      await signIn(data.email, data.password);
      onSuccess();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
