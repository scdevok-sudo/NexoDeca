/**
 * api.ts — Funciones que hablan con Supabase / Edge Functions (stubs tipados).
 * Módulo: M2 · Gestión de Personal (spec §2)
 *
 * Qué tiene que hacer:
 *  - Una función por endpoint de la sección API de la spec.
 *  - Todo acceso a datos por el cliente de Supabase (nunca SQL a mano desde el frontend).
 *  - PERMISOS: se verifican en RLS / Edge Functions; acá no alcanza con chequear el rol.
 */

import type { Paginated, UUID } from '../../types/common';
import type { Person, PersonnelFilters, PersonInput, ImportRejection, ImportReport } from './types';

/**
 * GET /personnel
 * PERMISOS: Gerente, Capacitador (solo lectura)
 * REGLA DE NEGOCIO: Por defecto solo personas activas.
 * TODO(M2): Filtros: DNI, nombre/apellido, puesto, estado. Orden por apellido+nombre o fecha de ingreso.
 * TODO(M2): Paginación server-side, PAGE_SIZE = 25.
 * TODO(M2): Errores: 400 si los filtros son inválidos.
 */
export async function listPersonnel(filters: PersonnelFilters): Promise<Paginated<Person>> {
  throw new Error('Not implemented: listPersonnel');
}

/**
 * POST /personnel
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: DNI único; el puesto debe existir y estar activo.
 * TODO(M2): Errores: 400 datos inválidos; 409 DNI duplicado.
 */
export async function createPerson(input: PersonInput): Promise<Person> {
  throw new Error('Not implemented: createPerson');
}

/**
 * PUT /personnel/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: El cambio de puesto no afecta registros históricos de capacitaciones ya dictadas.
 * TODO(M2): Errores: 404; 400; 409 si el DNI corresponde a otra persona.
 */
export async function updatePerson(id: UUID, input: PersonInput): Promise<Person> {
  throw new Error('Not implemented: updatePerson');
}

/**
 * DELETE /personnel/{id}
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: No se borra físicamente si tiene capacitaciones o certificados: se desactiva.
 * TODO(M2): Errores: 404.
 */
export async function deactivatePerson(id: UUID): Promise<void> {
  throw new Error('Not implemented: deactivatePerson');
}

/**
 * POST /personnel/import
 * PERMISOS: Gerente
 * REGLA DE NEGOCIO: Informar procesados, importados y rechazados, con el motivo de cada rechazo.
 * TODO(M2): Invoca la Edge Function import-personnel con el CSV.
 * TODO(M2): Errores: 400 si el archivo no respeta el formato esperado.
 */
export async function importPersonnel(file: File): Promise<ImportReport> {
  throw new Error('Not implemented: importPersonnel');
}
