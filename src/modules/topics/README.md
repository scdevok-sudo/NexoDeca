# M4 · Catálogo de Capacitaciones (Temas)

- **Horas estimadas:** 5 h
- **Perfil sugerido:** Frontend + Backend (CRUD)
- **Responsable:** _sin asignar_
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 4

## Dependencias

- Depende de: M1, M3 (puestos)
- Dependen de este: M5, M6, M8, M9

## Alcance

- CRUD de temas: nombre, tipo (Obligatorio | Electivo), puestos a los que aplica (N:M), periodicidad en meses (vacío = no vence), duración estimada en horas, activo (spec §4).
- Nombre de tema único.
- Búsqueda por nombre, tipo y puesto; paginación server-side de 25.
- Un tema inactivo no entra en planes nuevos, pero lo ya dictado no cambia.
- Cambiar los puestos de un tema no afecta capacitaciones ya dictadas.
- Solo el Gerente administra; el Capacitador consulta.

## Archivos de este módulo

- Frontend: `src/modules/topics/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/TopicsPage.tsx`
  - Componentes: `components/TopicsTable.tsx`, `components/TopicFilters.tsx`, `components/TopicForm.tsx`
- Migración: `supabase/migrations/0003_temas_y_temas_puestos.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /training-topics`
- `POST /training-topics`
- `PUT /training-topics/{id}`
- `DELETE /training-topics/{id} (desactiva)`

## Permisos

Solo el Gerente administra el catálogo de temas. El Capacitador solo consulta.

## Checklist (orden sugerido)

- [ ] Migración 0003: training_topics + topic_positions (N:M).
- [ ] api.ts: listTopics con filtros y paginación de 25.
- [ ] Formulario con selector múltiple de puestos activos.
- [ ] Validar nombre único (409).
- [ ] Desactivar sin tocar lo ya dictado.
- [ ] Probar permisos por rol.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M4)` pendientes (`grep -r "TODO(M4)" src supabase`).

## Fuera de alcance de este módulo

- Motor de formularios genérico / catálogos configurables (multi-cliente).
- Material didáctico adjunto (no está en la spec).
