# M9 · Reporte mensual YPF

- **Horas estimadas:** 6 h
- **Perfil sugerido:** Backend (agregación de datos y export a PDF/Excel)
- **Responsable:** _sin asignar_
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 9

## Dependencias

- Depende de: M4, M6 (y M7 para la numeración)
- Dependen de este: —

## Alcance

- Seleccionar mes y año y generar el reporte descargable (PDF o Excel, a definir con Juan) (spec §9).
- Por capacitación del mes: tema, fecha, nro de registro, capacitador.
- Nómina completa de participantes con su resultado.
- Descargar reportes de meses anteriores.
- Se puede generar con el mes en curso incompleto.
- El reporte generado se guarda como archivo histórico (no se regenera al vuelo) para poder reconstruir lo entregado a YPF.
- Gerente y Capacitador generan y descargan; el Operario no accede.

## Archivos de este módulo

- Frontend: `src/modules/reports/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/ReportsPage.tsx`
  - Componentes: `components/MonthYearPicker.tsx`, `components/ReportsHistoryList.tsx`
- Edge Function: `supabase/functions/monthly-report/index.ts`
- Migración: `supabase/migrations/0007_reportes.sql`
- Migración: `supabase/migrations/0009_storage_buckets.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /reports/monthly/{year}/{month}`

## Permisos

Gerente y Capacitador generan y descargan. El Operario no tiene acceso.

## Decisión pendiente: formato del reporte

La spec deja abierto si el reporte para YPF se entrega en **PDF o Excel** ("a definir con Juan"). No se eligió ninguna librería en el esqueleto. Confirmar con Juan, documentar acá y en `docs/decisiones-pendientes.md`, y recién ahí elegir la librería (si es PDF, ver también la decisión de M7 para reutilizar).

## Checklist (orden sugerido)

- [ ] Confirmar con Juan PDF vs. Excel y dejarlo en docs/decisiones-pendientes.md.
- [ ] Migración 0007 y bucket privado de reportes (0009).
- [ ] Edge Function monthly-report: agregar datos del mes, generar el archivo y guardarlo en Storage.
- [ ] Decidir qué pasa si se genera dos veces el mismo mes (nueva versión, conservar la anterior).
- [ ] Selector de mes/año y listado de reportes anteriores.
- [ ] Decidir si se incluyen las capacitaciones anuladas (TODO consultar a Santi).
- [ ] Probar permisos y descarga.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M9)` pendientes (`grep -r "TODO(M9)" src supabase`).

## Fuera de alcance de este módulo

- Gráficos y dashboard (Fase 2).
- Envío automático a YPF.
- Reportes por rangos distintos al mensual.
