# CLAUDE.md — SGI Deca (Fase 1: Capacitaciones)

## Qué es
Sistema de Gestión Integral para Nexoris / Deca Electromecánica. Fase 1 = solo Capacitaciones, un único cliente. Roles: Gerente y Capacitador (login con Supabase Auth). El Operario NO tiene login: consulta pública por DNI exacto en `/consulta`.

## Stack
React + Vite + TypeScript + Tailwind (frontend) · Supabase (PostgreSQL, Auth, Storage, Edge Functions en Deno) · Vercel. Librerías: react-router-dom, @tanstack/react-query, react-hook-form, zod. No agregues otras sin consultar.

## Estructura
- `docs/` — spec, contexto, decisiones pendientes y `docs/modulos/NN-*.md` (una ficha por módulo).
- `src/modules/<modulo>/` — `README.md` (ficha), `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`.
- `src/routes/index.tsx` — rutas y guards por rol. `src/auth/` — sesión y `RequireRole`.
- `supabase/migrations/` (estructura comentada), `supabase/functions/` (Edge Functions + `_shared/`).

## Reglas de trabajo
1. Antes de asumir una regla de negocio, leé la spec del módulo (`docs/especificacion-modulo1-fase1-capacitaciones.md`). Si no está ahí, preguntale a Santi; no inventes. Dejá `// TODO(consultar a Santi): ...`.
2. Todo acceso a datos por el cliente de Supabase (`src/lib/supabase.ts`). Nunca SQL a mano desde el frontend. Contraseñas por Supabase Auth, nunca hash a mano.
3. Los permisos se verifican del lado del servidor (RLS / Edge Functions). Ocultar un botón no es seguridad.
4. Validar en cliente (zod) Y en servidor.
5. Responsive en los 3 breakpoints: < 767px, 768–1024px (`md:`), > 1025px (`lg:`).
6. Nunca DELETE físico de personas, puestos, temas ni capacitaciones: se desactiva o se anula. El nro de registro de una capacitación es correlativo y no se reutiliza. El PDF de un certificado es inmutable y versionado.
7. No construyas Fase 2: inspecciones/QR, choferes, OPS, dashboard con gráficos, login con Google, firma digital, emails automáticos, multi-cliente.
8. Código y comentarios en el estilo del repo: español rioplatense, con `TODO(Mx)`, `REGLA DE NEGOCIO:` y `PERMISOS:`.

## Tareas pendientes
```bash
grep -r "TODO(M2)" src supabase        # pendientes de un módulo (SETUP, M1…M9, QA)
grep -r "TODO(consultar a Santi)" src supabase docs   # lo que la spec no define
```

## Chequeos antes de commitear
```bash
npx tsc --noEmit && npm run build && npm run lint
```

Para probar pantallas sin login real: `VITE_DEV_BYPASS_ROLE=gerente|capacitador` en `.env` (solo DEV).
