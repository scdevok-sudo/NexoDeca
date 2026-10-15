-- supabase/tests/database/m1_m2_m3_rls.test.sql — Permisos (RLS) y reglas de negocio de M1, M2 y M3 (pgTAP).
-- Correr: supabase test db
-- Corre sobre las migraciones reales (0010, 0011, 0012, 0017). Todo en una transacción con ROLLBACK.

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(40);

-- ---------- Datos base (como postgres: saltea RLS)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'gerente@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'capa@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'sinrol@test.local');
insert into public.profiles (id, nombre, rol) values
  ('00000000-0000-0000-0000-00000000000a', 'Gerente', 'gerente'),
  ('00000000-0000-0000-0000-00000000000b', 'Capacitador', 'capacitador');
insert into public.positions (id, nombre, activo) values
  ('10000000-0000-0000-0000-000000000001', 'Puesto Test', true),
  ('10000000-0000-0000-0000-000000000002', 'Puesto Viejo', false),
  ('10000000-0000-0000-0000-000000000003', 'Puesto Libre', true);

-- ================= ANON (Operario sin login): no accede a ninguna tabla
set local role anon;
select throws_ok($$ select * from public.personnel $$, '42501', null, 'anon no lee personnel');
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon no lee profiles');
select throws_ok($$ select * from public.positions $$, '42501', null, 'anon no lee positions');
select throws_ok($$ select public.auth_role() $$, '42501', null, 'anon no ejecuta auth_role()');
reset role;

-- ================= GERENTE
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

-- M2 · personal
select lives_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30123456', 'Ana', 'Gómez', '10000000-0000-0000-0000-000000000001', '2020-01-01') $$, 'gerente crea persona');
select throws_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30123456', 'Otro', 'X', '10000000-0000-0000-0000-000000000001', '2020-01-01') $$, '23505', null, 'DNI duplicado → 409');
select throws_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30123457', 'Ana', 'X', '10000000-0000-0000-0000-000000000002', '2020-01-01') $$, 'P0001', null, 'persona nueva con puesto inactivo → rechazo');
select throws_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30123458', 'Ana', 'X', '19999999-0000-0000-0000-000000000000', '2020-01-01') $$, 'P0001', null, 'puesto inexistente → rechazo');
select throws_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30.123', 'Ana', 'X', '10000000-0000-0000-0000-000000000001', '2020-01-01') $$, '23514', null, 'DNI con formato inválido → 400');
select throws_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30123459', '=HYPERLINK("x")', 'X', '10000000-0000-0000-0000-000000000001', '2020-01-01') $$, '23514', null, 'fórmula en nombre de persona → 400');

-- M3 · puestos
select lives_ok($$ insert into public.positions (nombre, descripcion) values ('Soldador', 'Suelda') $$, 'gerente crea puesto');
select throws_ok($$ insert into public.positions (nombre) values ('  soldador ') $$, '23505', null,
  'nombre de puesto duplicado (sin importar mayúsculas/espacios) → 409');
select throws_ok($$ insert into public.positions (nombre) values ('=cmd|calc') $$, '23514', null, 'fórmula en nombre de puesto → 400');
select throws_ok($$ insert into public.positions (nombre) values ('   ') $$, '23514', null, 'nombre de puesto vacío → 400');
select throws_ok($$ insert into public.positions (nombre, descripcion) values ('Largo', repeat('x', 501)) $$, '23514', null,
  'descripción de más de 500 caracteres → 400');
select lives_ok($$ update public.positions set descripcion = 'Ejecuta' where id = '10000000-0000-0000-0000-000000000001' $$,
  'gerente edita puesto');

-- Desactivar un puesto con personal: se permite (spec: "se desactiva") y el historial queda.
select lives_ok($$ update public.positions set activo = false where id = '10000000-0000-0000-0000-000000000001' $$,
  'gerente desactiva un puesto con personal asignado');
select lives_ok($$ update public.personnel set apellido = 'Gómez Pérez' where dni = '30123456' $$,
  'editar a alguien cuyo puesto se desactivó no obliga a cambiarle el puesto');
select throws_ok($$ update public.personnel set position_id = '10000000-0000-0000-0000-000000000002' where dni = '30123456' $$,
  'P0001', null, 'pasar a alguien a un puesto inactivo → rechazo');
select lives_ok($$ update public.personnel set position_id = '10000000-0000-0000-0000-000000000003' where dni = '30123456' $$,
  'pasar a alguien a un puesto activo → ok');

-- Temas (M4) con puestos inactivos
select lives_ok($$ insert into public.training_topics (id, nombre, tipo, duracion_horas)
  values ('20000000-0000-0000-0000-000000000001', 'Tema Test', 'obligatorio', 2) $$, 'gerente crea tema');
select throws_ok($$ insert into public.training_topic_positions values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002') $$, 'P0001', null,
  'asignar un puesto inactivo a un tema → rechazo');
select lives_ok($$ insert into public.training_topic_positions values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003') $$, 'asignar un puesto activo a un tema → ok');

-- Nunca DELETE físico ni cambio de roles desde la API
select throws_ok($$ delete from public.positions where id = '10000000-0000-0000-0000-000000000003' $$, '42501', null,
  'gerente NO borra puestos');
select throws_ok($$ delete from public.personnel where dni = '30123456' $$, '42501', null, 'gerente NO borra personas');
select throws_ok($$ update public.profiles set rol = 'gerente' where id = '00000000-0000-0000-0000-00000000000b' $$, '42501', null,
  'gerente NO cambia roles desde la API');
select is((select count(*)::int from public.profiles), 2, 'gerente lee todos los perfiles');

-- ================= CAPACITADOR (solo lectura)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.personnel), 1, 'capacitador lee personal');
-- Se cuentan solo los puestos del test: seed.sql también carga puestos de ejemplo.
select is((select count(*)::int from public.positions
           where id::text like '10000000-%' or nombre = 'Soldador'), 4,
  'capacitador lee puestos (también inactivos, para lo histórico)');
select is((select count(*)::int from public.profiles), 1, 'capacitador solo ve su propio perfil');
select throws_ok($$ insert into public.personnel (dni, nombre, apellido, position_id, fecha_ingreso)
  values ('30123460', 'Ana', 'X', '10000000-0000-0000-0000-000000000003', '2020-01-01') $$, '42501', null, 'capacitador NO crea personas');
select throws_ok($$ insert into public.positions (nombre) values ('Intruso') $$, '42501', null, 'capacitador NO crea puestos');
update public.positions set nombre = 'Hackeado' where id = '10000000-0000-0000-0000-000000000003';
update public.personnel set activo = false where dni = '30123456';

-- ================= USUARIO SIN PERFIL (cuenta de Auth sin rol)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.personnel), 0, 'usuario sin rol no ve personal');
select is((select count(*)::int from public.positions), 0, 'usuario sin rol no ve puestos');
select throws_ok($$ insert into public.positions (nombre) values ('Intruso 2') $$, '42501', null, 'usuario sin rol NO crea puestos');

-- ================= Verificaciones como postgres (salteando RLS)
reset role;
select is((select nombre from public.positions where id = '10000000-0000-0000-0000-000000000003'), 'Puesto Libre',
  'el update del capacitador sobre positions no tuvo efecto');
select is((select activo from public.personnel where dni = '30123456'), true,
  'el update del capacitador sobre personnel no tuvo efecto');
select is((select rol::text from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 'capacitador',
  'el capacitador sigue siendo capacitador');
select throws_ok($$ delete from public.positions where id = '10000000-0000-0000-0000-000000000002' $$, 'P0001', null,
  'ni con privilegios de servicio se borra un puesto (se desactiva)');
select throws_ok($$ delete from public.personnel where dni = '30123456' $$, 'P0001', null,
  'ni con privilegios de servicio se borra una persona (se desactiva)');

select * from finish();
rollback;
