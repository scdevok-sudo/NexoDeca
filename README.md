# SGI Deca · Fase 1 (Capacitaciones)

Sistema de Gestión Integral para **Nexoris / Deca Electromecánica**. La Fase 1 cubre solo **Capacitaciones**, para un único cliente (sin multi-tenant, sin motor de formularios genérico).

**Estado:** esqueleto. La estructura, las rutas, los tipos y las firmas están creados; la lógica la completa el equipo (Santi, Agustín, Ezequiel y Lucas). Compila, pero ninguna función hace nada todavía.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind, react-router-dom, @tanstack/react-query, react-hook-form, zod.
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions en Deno).
- Hosting: Vercel (frontend).

## Cómo levantarlo

```bash
npm install
cp .env.example .env      # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

Para navegar los módulos sin login real (solo en desarrollo), poné en `.env`:

```
VITE_DEV_BYPASS_ROLE=gerente      # o capacitador
```

Chequeos antes de un commit grande:

```bash
npx tsc --noEmit
npm run build
npm run lint
```

## Roles

- **Gerente** y **Capacitador**: con login (Supabase Auth).
- **Operario**: sin login. Consulta pública por DNI exacto en `/consulta` (camino 1 de la spec; ver `docs/decisiones-pendientes.md`).

## Mapa de módulos y estado

| Módulo | Horas | Frontend | Edge Function | Migración | Responsable | Estado |
|---|---:|---|---|---|---|---|
| Setup Supabase | 8 | `src/lib`, `src/types` | `_shared/` | 0001–0009 | _sin asignar_ | esqueleto |
| M1 Login y sesiones | 6 | `src/modules/login`, `src/auth` | `create-trainer-user` | 0002, 0008 | _sin asignar_ | esqueleto |
| M2 Gestión de Personal | 8 | `src/modules/personnel` | `import-personnel` | 0002 | _sin asignar_ | esqueleto |
| M3 Puestos | 4 | `src/modules/positions` | — | 0002 | _sin asignar_ | esqueleto |
| M4 Catálogo de Temas | 5 | `src/modules/topics` | — | 0003 | _sin asignar_ | esqueleto |
| M5 Plan Anual | 9 | `src/modules/plan` | — | 0004 | _sin asignar_ | esqueleto |
| M6 Dictado y Asistencia | 12 | `src/modules/trainings` | — | 0005 | _sin asignar_ | esqueleto |
| M7 Certificados | 9 | `src/modules/certificates` | `generate-certificates`, `certificates-by-dni` | 0006, 0009 | _sin asignar_ | esqueleto |
| M8 Vencimientos | 5 | `src/modules/compliance` | — (RPC `compliance_upcoming`) | 0021 | Lucas | hecho |
| M9 Reporte mensual YPF | 6 | `src/modules/reports` | `monthly-report`, `report-download` | 0022 | Lucas | hecho (falta desplegar las Edge Functions) |
| Testing, ajustes, deploy, buffer | 8 | — | — | — | Santi | pendiente |

Cada módulo tiene su ficha en `docs/modulos/` (y una copia en el `README.md` de su carpeta). Anotá tu nombre ahí cuando tomes uno.

## Estructura

```
docs/          spec, contexto, decisiones pendientes y una ficha por módulo
supabase/      config, migraciones (estructura comentada), seed y Edge Functions
src/
  lib/         cliente de Supabase, react-query, constantes
  types/       tipos compartidos y database.types.ts (placeholder)
  auth/        AuthProvider, useAuth, RequireRole
  components/  ui/ (componentes base) y layout/ (AppShell, Sidebar, Topbar)
  routes/      rutas centrales + guards por rol
  modules/     un directorio por módulo (README, types, schemas, api, hooks, components, pages)
```

## Convenciones

- **Pendientes:** todo lo que falta está marcado con `TODO(<módulo>)`. Buscalo con `grep -r "TODO(M2)" src supabase`. Prefijos: `SETUP`, `M1` … `M9`, `QA`. Lo que la spec no define está como `TODO(consultar a Santi)`.
- **Comentarios clave:** `REGLA DE NEGOCIO:` y `PERMISOS:` marcan lo que no se puede olvidar.
- **Datos:** siempre por el cliente de Supabase (`src/lib/supabase.ts`), nunca SQL a mano desde el frontend.
- **Permisos:** se verifican en RLS / Edge Functions. Ocultar un botón no es seguridad.
- **Responsive:** breakpoints de la spec en Tailwind (`src/index.css`): mobile < 767px (sin prefijo), tablet 768–1024px (`md:`), desktop > 1025px (`lg:`). Probá cada vista en los tres.
- **Paginación:** del lado del servidor, `PAGE_SIZE = 25`.
- **Nombres:** tablas y columnas de la base en inglés snake_case (siguen las rutas de la API de la spec); textos y comentarios en español.
- **Fase 2:** no crear nada de inspecciones, QR, choferes, OPS, dashboard con gráficos, login con Google, firma digital, emails automáticos ni multi-cliente.

## Documentación

- `docs/contexto-sistema-sgi-equipo.md` — contexto del proyecto y cómo se trabaja.
- `docs/especificacion-modulo1-fase1-capacitaciones.md` — fuente de verdad de los requerimientos.
- `docs/decisiones-pendientes.md` — decisiones abiertas y ambigüedades de la spec.
- `CONTRIBUTING.md` — ramas, commits, PRs y carga de horas.
