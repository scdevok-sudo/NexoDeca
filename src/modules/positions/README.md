# M3 · Puestos y Tipos de Personal

- **Horas estimadas:** 4 h
- **Perfil sugerido:** Frontend + Backend (CRUD simple)
- **Responsable:** _sin asignar_
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 3

## Dependencias

- Depende de: M1 (sesión)
- Dependen de este: M2, M4, M5, M6, M8

## Alcance

- CRUD de puestos: nombre, descripción, activo (spec §3).
- Nombre de puesto único.
- Precargar Oficial, Medio Oficial, Ayudante y Supervisor como datos de ejemplo (a confirmar con Juan antes de producción) → seed.sql.
- No se elimina un puesto con personal o temas asociados: se desactiva.
- Un puesto inactivo no se asigna a personal nuevo ni a temas nuevos, pero sigue visible en lo histórico.
- Solo el Gerente administra; el Capacitador consulta.
- Está acoplado a M2: conviene que lo tome quien haga Personal.

## Archivos de este módulo

- Frontend: `src/modules/positions/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/PositionsPage.tsx`
  - Componentes: `components/PositionsTable.tsx`, `components/PositionForm.tsx`
- Migración: `supabase/migrations/0002_puestos_y_personal.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`
- Migración: `supabase/migrations/seed.sql`

## Endpoints que implementa

- `GET /positions`
- `POST /positions`
- `PUT /positions/{id}`
- `DELETE /positions/{id} (desactiva)`

## Permisos

Solo el Gerente administra el catálogo. El Capacitador solo consulta.

## Checklist (orden sugerido)

- [ ] Migración 0002: tabla positions con nombre único (coordinar con Setup).
- [ ] api.ts: listPositions (con opción de incluir inactivos).
- [ ] Alta/edición con positionSchema.
- [ ] Mapear 409 por nombre duplicado.
- [ ] DELETE: si tiene personal o temas asociados responde 409/desactiva según la regla; confirmar comportamiento con Santi.
- [ ] Completar seed.sql con los 4 puestos de ejemplo.
- [ ] Probar permisos por rol.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M3)` pendientes (`grep -r "TODO(M3)" src supabase`).

## Fuera de alcance de este módulo

- Jerarquías o niveles de puestos.
- Multi-sucursal.
