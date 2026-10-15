-- 0023_positions_m3_completar.sql
-- Módulo: M3 · Puestos y Tipos de Personal (spec §3). Completa la versión mínima de 0011.
-- Depende de 0010 (personnel, auth_role, set_updated_at), 0011 (positions) y 0012 (training_topic_positions).
-- Nota: numerada originalmente como 0017, pero se aplica después de 0018-0022 (M4-M9) por quedar
-- rescatada de una rama separada. No tiene conflicto estructural con esas migraciones.
-- Convención: no se editan migraciones ya aplicadas; todo cambio va en una nueva.

-- ============================================================
-- positions: columnas que faltaban (0002 las define: descripcion; + updated_at para auditoría)
-- ============================================================
alter table public.positions
  add column descripcion text not null default '',
  add column updated_at  timestamptz not null default now();

-- Límites de largo, y el nombre no puede arrancar con =, +, -, @ ni espacios
-- (evita inyección de fórmulas cuando el nombre del puesto se exporta a Excel en el reporte M9).
alter table public.positions
  add constraint positions_nombre_largo check (char_length(nombre) <= 80),
  add constraint positions_nombre_formato check (nombre !~ '^[=+\-@[:space:]]'),
  add constraint positions_descripcion_largo check (char_length(descripcion) <= 500);

-- Normaliza el nombre (sin espacios al borde ni repetidos) antes de los CHECK y del índice único.
create or replace function public.positions_normalize()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nombre := pg_catalog.btrim(pg_catalog.regexp_replace(new.nombre, '\s+', ' ', 'g'));
  new.descripcion := pg_catalog.btrim(new.descripcion);
  return new;
end;
$$;
revoke all on function public.positions_normalize() from public, anon, authenticated;

create trigger positions_normalize
  before insert or update of nombre, descripcion on public.positions
  for each row execute function public.positions_normalize();

create trigger positions_set_updated_at
  before update on public.positions
  for each row execute function public.set_updated_at();

-- ============================================================
-- REGLA DE NEGOCIO (spec §3): un puesto inactivo no se asigna a personal NUEVO ni a temas NUEVOS,
-- pero sigue visible en lo histórico.
-- Se valida solo al insertar o al CAMBIAR el puesto: editar otro dato de alguien cuyo puesto se
-- desactivó después no falla.
-- security definer + search_path vacío: ve positions aunque quien escribe no tenga permiso de lectura
-- (así un usuario sin rol recibe el 42501 de RLS y no un mensaje sobre el puesto). Solo hace un EXISTS.
-- ============================================================
create or replace function public.ensure_position_active()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.position_id is distinct from old.position_id then
    if not exists (select 1 from public.positions p where p.id = new.position_id and p.activo) then
      raise exception 'El puesto seleccionado no existe o está inactivo' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.ensure_position_active() from public, anon, authenticated;

-- Cierra el pendiente de M3 que dejó 0010 (trigger de puesto activo).
create trigger personnel_ensure_position_active
  before insert or update of position_id on public.personnel
  for each row execute function public.ensure_position_active();

-- Temas (M4): training_topic_positions no se actualiza (solo insert/delete), alcanza con el insert.
create trigger training_topic_positions_ensure_position_active
  before insert on public.training_topic_positions
  for each row execute function public.ensure_position_active();

-- ============================================================
-- REGLA DE NEGOCIO (CLAUDE.md regla 6): nunca DELETE físico de puestos ni de personas.
-- La API ya no tiene grant de DELETE (0010/0011); esto lo bloquea también para la service role.
-- ============================================================
create or replace function public.forbid_delete()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'No se permite borrar registros de %: se desactivan', tg_table_name using errcode = 'P0001';
end;
$$;
revoke all on function public.forbid_delete() from public, anon, authenticated;

create trigger positions_forbid_delete
  before delete on public.positions
  for each row execute function public.forbid_delete();
create trigger personnel_forbid_delete
  before delete on public.personnel
  for each row execute function public.forbid_delete();

-- ============================================================
-- M2 (pendiente de 0010): nombres de personas sin prefijo de fórmula, por el mismo motivo que positions
-- (van al reporte Excel de M9). El form y la Edge Function ya lo validan; esto cubre un insert directo por API.
-- ============================================================
alter table public.personnel
  add constraint personnel_nombres_formato
  check (nombre !~ '^[=+\-@[:space:]]' and apellido !~ '^[=+\-@[:space:]]');

-- ============================================================
-- Endurecimiento de auth_role() (0010): search_path vacío en una función security definer,
-- para que nadie pueda "secuestrarla" creando objetos con el mismo nombre en otro schema.
-- Mismo resultado: todas las referencias ya están calificadas.
-- ============================================================
create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select rol from public.profiles where id = auth.uid()
$$;
