-- 0011_positions_minimo.sql
-- Módulos: M3 · Puestos (versión mínima), M2 · Personal
-- Destraba el alta de personal: personnel.position_id es NOT NULL y positions no existía (ver 0010).
-- Depende de 0010 (user_role, profiles, personnel, auth_role()).

-- ============================================================
-- positions (M3) — MÍNIMO A PROPÓSITO
-- ============================================================
-- TODO(M3): esto es solo lo indispensable para poder asignar un puesto. Cuando se construya el módulo de
--   verdad se expande con lo que define 0002 (descripcion, unicidad de nombre case-insensitive, etc.), la pantalla
--   de administración y las reglas de desactivación. No es el diseño final.
create table public.positions (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(btrim(nombre)) > 0),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Nombre único sin importar mayúsculas/espacios sobrantes: el import CSV resuelve el puesto por nombre y un
-- duplicado elegiría uno sin avisar (spec §3: no dos puestos con el mismo nombre).
create unique index positions_nombre_lower_key on public.positions (lower(btrim(nombre)));

-- ============================================================
-- FK personnel.position_id -> positions.id  (el ALTER que 0010 dejó comentado)
-- ON DELETE RESTRICT: un puesto con personal no se borra, se desactiva.
-- ============================================================
alter table public.personnel
  add constraint personnel_position_id_fkey
  foreign key (position_id) references public.positions (id) on delete restrict;

-- ============================================================
-- RLS (mismo criterio que personnel)
-- ============================================================
alter table public.positions enable row level security;

-- Primero se saca todo (incluidos los grants por defecto de Supabase), después se da lo necesario.
revoke all on public.positions from anon, authenticated;

-- Lectura Gerente y Capacitador; escritura solo Gerente. Sin DELETE: los puestos se desactivan.
grant select, insert, update on public.positions to authenticated;
create policy positions_select on public.positions
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));
create policy positions_insert on public.positions
  for insert to authenticated
  with check (public.auth_role() = 'gerente');
create policy positions_update on public.positions
  for update to authenticated
  using (public.auth_role() = 'gerente')
  with check (public.auth_role() = 'gerente');

-- TODO(SETUP): sumar al test por rol: capacitador no puede insert/update en positions; nadie puede delete;
--   anon no puede select; dos puestos con el mismo nombre (aunque cambie el case) fallan; borrar un puesto con personal asignado falla por la FK.
