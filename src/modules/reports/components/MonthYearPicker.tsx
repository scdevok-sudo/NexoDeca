/**
 * components/MonthYearPicker.tsx — Selector de mes y año.
 * Módulo: M9 · Reporte mensual YPF (spec §9)
 *
 * Qué tiene que hacer:
 *  - react-hook-form + monthYearSchema. Por defecto, el mes en curso.
 */

import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { monthYearSchema } from '../schemas';

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface FormValues {
  month: string;
  year: string;
}

interface Props {
  onSubmit: (year: number, month: number) => void;
  loading: boolean;
}

export function MonthYearPicker({ onSubmit, loading }: Props) {
  const hoy = new Date();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { month: String(hoy.getMonth() + 1), year: String(hoy.getFullYear()) },
  });

  const submit = handleSubmit((v) => {
    const parsed = monthYearSchema.safeParse({ year: Number(v.year), month: Number(v.month) });
    if (parsed.success) {
      onSubmit(parsed.data.year, parsed.data.month);
      return;
    }
    // Cada error va a su campo; el de "mes futuro" es de todo el objeto (sin campo): se muestra en "Mes".
    for (const issue of parsed.error.issues) {
      setError(issue.path[0] === 'year' ? 'year' : 'month', { message: issue.message });
    }
  });

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-3" noValidate>
      <Select
        label="Mes"
        options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))}
        error={errors.month?.message}
        {...register('month')}
      />
      <Input
        label="Año"
        type="number"
        inputMode="numeric"
        min={2020}
        max={hoy.getFullYear()}
        error={errors.year?.message}
        {...register('year')}
      />
      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Generando…' : 'Generar reporte'}
        </Button>
      </div>
    </form>
  );
}
