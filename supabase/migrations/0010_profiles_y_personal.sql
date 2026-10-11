-- 0010_profiles_y_personal.sql
-- Módulos: M1 · perfiles de usuario, M2 · Personal
-- Implementa lo que 0001 (enum user_role) y 0002 (profiles, personnel) dejaron comentado.
-- Alcance: SOLO user_role, profiles y personnel. positions, trainings, etc. quedan para sus módulos.
-- Convención del repo: tablas y columnas en inglés snake_case, valores de enums y comentarios en español.

-- ============================================================
-- Enum
-- ============================================================
create type public.user_role as enum ('gerente', 'capacitador');   -- el Operario NO tiene usuario

-- ============================================================
-- profiles (M1) — rol de cada usuario de Supabase Auth
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null check (length(btrim(nombre)) > 0),
  rol         public.user_role not null,                 -- un único rol por usuario (spec §1)
  created_at  timestamptz not null default now()
);
comment on table public.profiles is 'Rol de cada usuario de Auth. Se escribe solo con service role (Edge Function create-trainer-user).';

-- ============================================================
-- Helpers
-- ============================================================
-- security definer para que las policies de otras tablas puedan leer el rol sin recursar sobre las de profiles.
-- REGLA DE NEGOCIO: el rol sale SIEMPRE de profiles, nunca de user_metadata (que el usuario puede editar).
create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select rol from public.profiles where id = auth.uid()
$$;
revoke all on function public.auth_role() from public, anon;
grant execute on function public.auth_role() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- personnel (M2)
-- ============================================================
create table public.personnel (
  id             uuid primary key default gen_random_uuid(),
  dni            text not null,
  nombre         text not null check (length(btrim(nombre)) > 0),
  apellido       text not null check (length(btrim(apellido)) > 0),
  position_id    uuid not null,                          -- FK a positions: ver bloque condicional más abajo
  fecha_ingreso  date not null,
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint personnel_dni_key unique (dni),             -- spec §2: no dos personas con el mismo DNI
  constraint personnel_dni_formato check (dni ~ '^\d{7,8}$')
  -- TODO(M2): confirmar el formato de DNI (7-8 dígitos) con Santi; mismo regex que personSchema y la Edge Function.
);

create index personnel_apellido_nombre_idx on public.personnel (apellido, nombre);
create index personnel_fecha_ingreso_idx   on public.personnel (fecha_ingreso);
create index personnel_position_id_idx     on public.personnel (position_id);
create index personnel_activo_idx          on public.personnel (activo);

create trigger personnel_set_updated_at
  before update on public.personnel
  for each row execute function public.set_updated_at();

-- FK a positions (ON DELETE RESTRICT: un puesto con personal no se borra, se desactiva).
-- positions todavía no existe en este repo (0002 es solo comentarios). Si ya está creada se agrega acá;
-- si no, la migración de M3 tiene que agregar:
--   alter table public.personnel add constraint personnel_position_id_fkey
--     foreign key (position_id) references public.positions (id) on delete restrict;
-- El front lee `positions(nombre)` embebido, que necesita esa FK.
do $$
begin
  if to_regclass('public.positions') is not null then
    alter table public.personnel
      add constraint personnel_position_id_fkey
      foreign key (position_id) references public.positions (id) on delete restrict;
  end if;
end $$;
-- TODO(M3): trigger que verifique que el puesto esté activo al crear/asignar (hoy lo validan el form y la Edge Function).

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.personnel enable row level security;

-- Sacamos los grants por defecto de Supabase; después damos solo lo necesario.
revoke all on public.profiles  from anon, authenticated;
revoke all on public.personnel from anon, authenticated;

-- profiles: lectura del propio perfil o Gerente. Sin escritura desde el cliente: solo service role (ignora RLS).
-- PERMISOS: nadie puede cambiarse su propio rol; no hay grants de insert/update/delete.
grant select on public.profiles to authenticated;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.auth_role() = 'gerente');

-- personnel: lectura Gerente y Capacitador; escritura solo Gerente. Nunca DELETE (se desactiva).
-- El Operario no accede por tabla (consulta pública por Edge Function certificates-by-dni).
grant select, insert, update on public.personnel to authenticated;
create policy personnel_select on public.personnel
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));
create policy personnel_insert on public.personnel
  for insert to authenticated
  with check (public.auth_role() = 'gerente');
create policy personnel_update on public.personnel
  for update to authenticated
  using (public.auth_role() = 'gerente')
  with check (public.auth_role() = 'gerente');

-- TODO(SETUP): test por rol (script SQL) que pruebe:
--   capacitador: update profiles set rol='gerente' -> falla; insert/update personnel -> falla; select personnel -> ok.
--   gerente: insert/update personnel -> ok; delete personnel -> falla.
--   anon: select en profiles/personnel -> falla.
