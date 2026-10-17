# M5 · Plan Anual de Capacitación

- **Horas estimadas:** 9 h
- **Perfil sugerido:** Frontend (UI de planificación mensual) + Backend
- **Responsable:** Lucas
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 5

## Dependencias

- Depende de: M2, M3, M4
- Dependen de este: M6 (contexto), M8, M9

## Alcance

- Un plan por año; por cada mes el Gerente asigna uno o más temas del catálogo (spec §5).
- El sistema calcula, para cada tema planificado en un mes, qué personas deberían tomarlo según su puesto.
- Copiar el plan de un año a otro como punto de partida.
- Consultar el plan actual y los históricos.
- Modificar un mes ya con capacitaciones dictadas no borra ni altera lo dictado (el plan es la intención, lo dictado es el hecho).
- El plan no reemplaza al catálogo: solo define cuándo se dicta cada tema.
- Solo el Gerente arma y modifica; el Capacitador consulta.

## Archivos de este módulo

- Frontend: `src/modules/plan/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/PlanPage.tsx`
  - Componentes: `components/PlanMonthColumn.tsx`, `components/PlanTopicPicker.tsx`, `components/CopyPlanModal.tsx`, `components/ExpectedAttendeesPanel.tsx`
- Migración: `supabase/migrations/0004_plan_anual.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /training-plans/{year}`
- `PUT /training-plans/{year}`
- `POST /training-plans/{year}/copy-from/{source_year}`

## Permisos

Solo el Gerente arma y modifica el plan. El Capacitador lo consulta.

## Checklist (orden sugerido)

- [ ] Migración 0004: training_plans (uno por año) + training_plan_items (mes, tema).
- [ ] api.ts: getPlan, upsertPlan (reemplazo de asignaciones por mes).
- [ ] UI de 12 meses con selector de temas activos.
- [ ] Cálculo de "quién debería tomarlo" por puesto (decidir si va en la API o en una vista SQL).
- [ ] copyPlan con 404 si el año de origen no tiene plan.
- [ ] Validar 400 si algún tema no existe o está inactivo.
- [ ] Navegar a años anteriores (históricos).
- [ ] Probar permisos por rol.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M5)` pendientes (`grep -r "TODO(M5)" src supabase`).

## Fuera de alcance de este módulo

- Cumplimiento real vs. plan (es de M6/M8/M9).
- Notificaciones automáticas.
- Gráficos (dashboard es Fase 2).
