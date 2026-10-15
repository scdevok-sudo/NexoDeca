/**
 * schemas.ts — Esquemas zod de validación.
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Alineado con la tabla personnel (supabase/migrations/0010_profiles_y_personal.sql) y con
 * supabase/functions/_shared/validation.ts (Edge Function import-personnel): mantener las tres en sync.
 * La validación del cliente es comodidad: la base (CHECK/UNIQUE/RLS) y las Edge Functions repiten todo.
 */

import { z } from 'zod';

/** Tope del CSV de importación (el servidor corta en el mismo valor). */
export const IMPORT_MAX_BYTES = 1024 * 1024;

/** DNI: 7 u 8 dígitos (CHECK personnel_dni_formato). Se aceptan puntos y espacios y se normalizan. */
// TODO(M2): confirmar el formato de DNI con Santi (hoy 7-8 dígitos, solo números).
const dni = z
  .string()
  .transform((s) => s.trim().replace(/[.\s]/g, ''))
  .pipe(z.string().regex(/^\d{7,8}$/, 'El DNI tiene que tener 7 u 8 dígitos'));

/** Nombre/apellido: no vacío (CHECK de la base) y arranca con letra (evita inyección de fórmulas al exportar a Excel). */
const nombrePersona = (campo: string) =>
  z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(1, `Ingresá el ${campo}`)
        .max(80, 'Máximo 80 caracteres')
        .regex(/^\p{L}[\p{L}\s'.-]*$/u, 'Solo letras, espacios, apóstrofo, punto o guion'),
    );

/** AAAA-MM-DD y que la fecha exista (la columna es date: 2025-02-30 la rechaza la base). */
const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD')
  .refine((s) => {
    const d = new Date(s + 'T00:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'La fecha no existe');

const puestoId = z.string().min(1, 'Seleccioná un puesto').pipe(z.uuid('Puesto inválido'));

export const personSchema = z.object({
  dni,
  nombre: nombrePersona('nombre'),
  apellido: nombrePersona('apellido'),
  // REGLA DE NEGOCIO: el puesto debe existir y estar activo (se verifica en el servidor, no solo acá).
  puestoId,
  fechaIngreso: fechaISO,
  // Solo en edición (reactivar/desactivar). Si no viene, la base usa su default (true).
  activo: z.boolean().optional(),
});

// TODO(M2): definir el formato exacto del CSV (columnas y separador). TODO(consultar a Santi) si Juan ya tiene una planilla modelo.
export const importRowSchema = personSchema.extend({
  // En el CSV el puesto puede venir por nombre; la Edge Function lo resuelve a id.
  puestoId: z.string().optional(),
  puesto: z.string().min(1),
});

/** Filtros de GET /personnel. Un valor inválido es un 400, no se ignora en silencio. */
export const personnelFiltersSchema = z.object({
  // Prefijo de DNI: solo dígitos, así no se cuelan comodines de LIKE (% _).
     // Se aceptan puntos y espacios ("30.123") como en el alta; se normalizan antes de validar.
     dni: z
       .string()
       .transform((s) => s.trim().replace(/[.\s]/g, ''))
       .pipe(z.string().regex(/^\d{1,8}$/, 'El DNI son hasta 8 dígitos'))
    .optional(),
  q: z.string().max(100, 'Máximo 100 caracteres').optional(),
  puestoId: z.uuid('Puesto inválido').optional(),
  estado: z.enum(['activos', 'inactivos', 'todos']).optional(),
  orden: z.enum(['apellido_nombre', 'fecha_ingreso']).optional(),
  page: z.number().int().min(1),
});

export type PersonFormValues = z.infer<typeof personSchema>;
