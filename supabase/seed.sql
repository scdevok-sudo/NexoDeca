-- supabase/seed.sql — Datos de ejemplo para desarrollo (STUB).
-- Módulo: Setup (y M3 para los puestos).
--
-- TODO(SETUP): completar una vez escritas las migraciones. Solo para entornos de desarrollo.
-- NO ejecutable todavía: todo está comentado a propósito.

-- Puestos de ejemplo (spec §3). A confirmar con Juan antes de ir a producción.
-- insert into positions (nombre, descripcion, activo) values
--   ('Oficial',        'TODO(M3): descripción', true),
--   ('Medio Oficial',  'TODO(M3): descripción', true),
--   ('Ayudante',       'TODO(M3): descripción', true),
--   ('Supervisor',     'TODO(M3): descripción', true);

-- Usuarios de prueba (uno por rol), creados vía Supabase Auth + fila en profiles.
-- TODO(SETUP): cómo sembrar usuarios de Auth en local (auth.users) y sus perfiles:
--   gerente@deca.test      -> rol gerente
--   capacitador@deca.test  -> rol capacitador
-- OJO: contraseñas de prueba solo en local, nunca en producción.

-- Personal, temas y plan de ejemplo (opcional, para probar M2 a M8).
-- TODO(SETUP): algunas personas de ejemplo con DNI ficticios.
