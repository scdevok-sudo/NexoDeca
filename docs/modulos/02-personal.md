# M2 · Gestión de Personal

- **Horas estimadas:** 8 h
- **Perfil sugerido:** Frontend + Backend (CRUD, validaciones, import CSV)
- **Responsable:** _sin asignar_
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 2

## Dependencias

- Depende de: M1 (sesión), M3 (puestos)
- Dependen de este: M5, M6, M7, M8

## Alcance

- CRUD de personal: DNI, nombre y apellido, puesto, fecha de ingreso, activo, fechas de creación/modificación (spec §2).
- DNI único; el puesto debe existir y estar activo.
- Importación masiva por CSV con informe: procesados, importados y rechazados con el motivo de cada rechazo.
- Búsqueda por DNI, nombre/apellido, puesto y estado; orden por apellido+nombre y por fecha de ingreso.
- Paginación del lado del servidor, 25 por página.
- No se elimina a quien tiene capacitaciones o certificados: se desactiva.
- Una persona inactiva no entra en capacitaciones nuevas, pero su historial se sigue viendo.
- Un cambio de puesto NO modifica retroactivamente lo ya dictado (el puesto histórico vive en la asistencia, M6).
- Desde el detalle de la persona se ve su historial de certificados (componente de M7).

## Archivos de este módulo

- Frontend: `src/modules/personnel/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/PersonnelListPage.tsx`, `pages/PersonnelDetailPage.tsx`
  - Componentes: `components/PersonnelTable.tsx`, `components/PersonnelFilters.tsx`, `components/PersonForm.tsx`, `components/PersonnelImportModal.tsx`
- Edge Function: `supabase/functions/import-personnel/index.ts`
- Migración: `supabase/migrations/0002_puestos_y_personal.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /personnel`
- `POST /personnel`
- `PUT /personnel/{id}`
- `DELETE /personnel/{id} (desactiva)`
- `POST /personnel/import`

## Permisos

Gerente: acceso completo (crear, editar, desactivar, importar). Capacitador: solo lectura.

## Checklist (orden sugerido)

- [ ] Migración 0002: tabla personnel con DNI único e índices de búsqueda (coordinar con Setup).
- [ ] api.ts: listPersonnel con filtros, orden y paginación de 25 (range de supabase-js).
- [ ] Por defecto listar solo activos.
- [ ] Formulario de alta/edición con personSchema (formato de DNI, puesto activo).
- [ ] Mapear el error de DNI duplicado a 409 con mensaje claro.
- [ ] Desactivar en vez de borrar (DELETE lógico).
- [ ] Edge Function import-personnel: parseo del CSV, validación fila por fila, informe de rechazos.
- [ ] Pantalla de importación con el informe procesados/importados/rechazados.
- [ ] Detalle de la persona con el historial de certificados (PersonCertificatesPanel de M7).
- [ ] Probar permisos: Capacitador solo lectura.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M2)` pendientes (`grep -r "TODO(M2)" src supabase`).

## Fuera de alcance de este módulo

- Multi-empresa, sectores o sucursales.
- Cuentas de usuario para empleados.
- Choferes (Fase 2).
