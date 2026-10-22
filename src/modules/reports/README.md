# M9 · Reporte mensual YPF

- **Horas estimadas:** 6 h
- **Perfil sugerido:** Backend (agregación de datos y export a PDF/Excel)
- **Responsable:** Lucas
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
- Migración: `supabase/migrations/0022_monthly_reports.sql` (tabla real; 0007 era solo el diseño comentado)
- Edge Function: `supabase/functions/report-download/index.ts` (descarga del historial)
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /reports/monthly/{year}/{month}`

## Permisos

Gerente y Capacitador generan y descargan. El Operario no tiene acceso.

## Decisión pendiente: formato del reporte

La spec deja abierto si el reporte para YPF se entrega en **PDF o Excel** ("a definir con Juan"). No se eligió ninguna librería en el esqueleto. Confirmar con Juan, documentar acá y en `docs/decisiones-pendientes.md`, y recién ahí elegir la librería (si es PDF, ver también la decisión de M7 para reutilizar).

## Checklist (orden sugerido)

- [x] Excel (.xlsx con exceljs), según docs/decisiones-tecnicas.md. Falta que Juan lo confirme.
- [x] Migración 0022 (monthly_reports) y bucket privado reportes-mensuales (0016).
- [x] Edge Function monthly-report: agrega los datos del mes, genera el Excel y lo guarda en Storage.
- [x] Decidido (Lucas, 2026-10-17): versión nueva, la anterior queda.
- [x] Selector de mes/año y listado de reportes anteriores.
- [x] Decidido (Lucas, 2026-10-17): figuran marcadas como Anulada, sin nómina.
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
