# Setup · Supabase (schema, RLS, Auth)

- **Horas estimadas:** 8 h
- **Perfil sugerido:** Backend — diseño de base de datos y Supabase (RLS, Auth)
- **Responsable:** Santi (según la spec; confirmar)
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección "División de tareas"

## Dependencias

- Depende de: nada.
- Dependen de este: todos los módulos.

## Alcance

- Proyecto de Supabase y `supabase/config.toml`.
- Migraciones 0001 a 0009 (hoy son estructura comentada): enums, puestos y personal, temas, plan, capacitaciones y asistencia, certificados, reportes, RLS y buckets de Storage.
- Auth: usuarios con rol Gerente o Capacitador (tabla `profiles`). El Operario no tiene usuario.
- RLS por tabla según los permisos de cada módulo.
- `seed.sql` con puestos de ejemplo y usuarios de prueba.
- Helpers compartidos de Edge Functions: `_shared/cors.ts`, `auth.ts`, `errors.ts`, `logger.ts`.
- Tipos generados en `src/types/database.types.ts`.

## Archivos de este módulo

- `supabase/config.toml`, `supabase/seed.sql`
- `supabase/migrations/0001_…` a `0009_…`
- `supabase/functions/_shared/`
- `src/lib/supabase.ts`, `src/types/database.types.ts`

## Checklist (orden sugerido)

- [ ] Crear el proyecto en Supabase y completar `.env` (a partir de `.env.example`).
- [ ] Escribir 0001 (enums) y 0002 a 0007 (tablas) a partir de los comentarios de cada archivo.
- [ ] Decidir dónde vive el rol (tabla `profiles` vs. `app_metadata`) y dejarlo escrito.
- [ ] 0008: RLS por tabla, con una política por rol.
- [ ] 0009: buckets privados de certificados y reportes.
- [ ] Completar `seed.sql`.
- [ ] Implementar `_shared/auth.ts` (validar JWT + rol).
- [ ] Generar `database.types.ts` (`supabase gen types typescript`).
- [ ] Avisar al equipo: los módulos M1 a M9 dependen de esto.

## Criterios de "listo"

- [ ] Las migraciones corren de cero (`supabase db reset`) sin errores.
- [ ] Cada tabla tiene RLS activada y probada por rol.
- [ ] `npm run build` y `npx tsc --noEmit` limpios con los tipos generados.
- [ ] Sin `TODO(SETUP)` pendientes (`grep -r "TODO(SETUP)" src supabase`).

## Fuera de alcance

- Multi-tenant, tablas de Fase 2 (equipos, inspecciones, OPS, choferes, QR).
