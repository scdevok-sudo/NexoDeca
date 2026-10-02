# M1 · Login y sesiones

- **Horas estimadas:** 6 h
- **Perfil sugerido:** Frontend + Auth (Supabase Auth)
- **Responsable:** _sin asignar_
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 1

## Dependencias

- Depende de: Setup (tabla de perfiles/roles, Auth)
- Dependen de este: Todos (guards de rol y sesión)

## Alcance

- Formulario de login con email y contraseña vía Supabase Auth (spec §1).
- Cada usuario tiene un único rol: Gerente o Capacitador.
- Verificación de sesión y de rol en cada pantalla protegida (guards en el frontend + RLS/Edge Functions en el servidor).
- Cierre de sesión.
- El Gerente crea las cuentas de Capacitador (no hay auto-registro) → Edge Function create-trainer-user.
- El Operario NO tiene usuario: su vista pública vive en el módulo M7 (camino 1 de la spec).
- Contraseñas siempre por Supabase Auth, nunca hash a mano.

## Archivos de este módulo

- Frontend: `src/modules/login/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/LoginPage.tsx`, `pages/TrainerUsersPage.tsx`
  - Componentes: `components/LoginForm.tsx`, `components/CreateTrainerForm.tsx`
- Edge Function: `supabase/functions/create-trainer-user/index.ts`
- Migración: `supabase/migrations/0002_puestos_y_personal.sql (tabla profiles)`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `(no está en la spec, necesaria) POST create-trainer-user`

## Permisos

Gerente y Capacitador pueden iniciar sesión. El Operario no tiene usuario. Solo el Gerente crea Capacitadores.

## Checklist (orden sugerido)

- [ ] Completar AuthProvider: sesión de Supabase, carga del perfil (rol) y suscripción a onAuthStateChange.
- [ ] Implementar signIn / signOut / getMe en api.ts.
- [ ] Formulario de login con react-hook-form + zod (loginSchema).
- [ ] Completar RequireRole (redirecciones: sin sesión → /login, rol no permitido → pantalla 403).
- [ ] Edge Function create-trainer-user: validar que quien llama es Gerente (_shared/auth.ts), crear el usuario con la Admin API y su perfil con rol capacitador.
- [ ] Pantalla del Gerente para dar de alta Capacitadores (TrainerUsersPage).
- [ ] Sacar o dejar solo bajo import.meta.env.DEV el bypass de roles (VITE_DEV_BYPASS_ROLE).
- [ ] Probar cada ruta con cada rol y sin sesión.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M1)` pendientes (`grep -r "TODO(M1)" src supabase`).

## Fuera de alcance de este módulo

- Login con Google (Fase 2).
- Cuentas individuales para Operarios (camino 2, decisión pendiente).
- Multi-empresa / sectores / sucursales.
- Recuperación de contraseña (no figura en la spec).
