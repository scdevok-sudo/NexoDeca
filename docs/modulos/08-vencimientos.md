# M8 · Vencimientos y notificaciones

- **Horas estimadas:** 5 h
- **Perfil sugerido:** Backend (cálculo de fechas) + Frontend (panel y filtros)
- **Responsable:** Lucas
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 8

## Dependencias

- Depende de: M2, M3, M4, M6
- Dependen de este: —

## Alcance

- Para cada persona y cada tema obligatorio que le corresponde según su puesto: fecha del último curso aprobado y fecha de próximo vencimiento (spec §8).
- Panel para Gerente y Capacitador: vencidas y próximas a vencer (default 15 días), agrupadas por tema.
- Filtros por puesto y por tema.
- Es un panel dentro del sistema: NO hay notificaciones automáticas por email (fuera de presupuesto).
- Avisarle al empleado sigue siendo manual (ej. WhatsApp).
- No hay vista para el Operario en esta fase.

## Archivos de este módulo

- Frontend: `src/modules/compliance/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/CompliancePage.tsx`
  - Componentes: `components/ComplianceTable.tsx`, `components/ComplianceFilters.tsx`
- Migración: `supabase/migrations/0021_vencimientos.sql` (RPC `compliance_upcoming`; la Edge Function del esqueleto se eliminó)
- Migración: `supabase/migrations/(usa tablas de 0002, 0003 y 0005; opcionalmente una vista SQL)`

## Endpoints que implementa

- `GET /compliance/upcoming`

## Permisos

Gerente y Capacitador acceden al panel completo. No hay vista para el Operario.

## Checklist (orden sugerido)

- [ ] Definir el cálculo: último aprobado por (persona, tema) + periodicidad en meses.
- [x] Decidido (Lucas, 2026-10-17): función en la base `compliance_upcoming` (0021), sin Edge Function.
- [ ] Considerar solo personal activo y temas obligatorios activos con periodicidad.
- [ ] Filtros por puesto, tema y rango de días (default 15).
- [ ] Panel agrupado por tema, responsive.
- [x] Decidido (Lucas, 2026-10-17): quien nunca lo aprobó aparece como "Nunca lo hizo".
- [ ] Probar permisos: solo Gerente y Capacitador.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M8)` pendientes (`grep -r "TODO(M8)" src supabase`).

## Fuera de alcance de este módulo

- Emails o WhatsApp automáticos.
- Vista para el Operario (camino 2).
- Gráficos (Fase 2).
