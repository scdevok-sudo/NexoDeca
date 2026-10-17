-- 0021_vencimientos.sql
-- Módulo: M8 · Seguimiento de Vencimientos (spec §8, GET /compliance/upcoming)
-- Depende de 0010 (personnel, auth_role), 0011 (positions), 0012 (training_topics, training_topic_positions)
--   y 0014 (trainings, training_attendees).
--
-- Se resolvió con una función en la base (RPC) y no con la Edge Function compliance-upcoming del esqueleto
--   (decidido con Lucas, 2026-10-17): es solo lectura y cálculo, y así no depende de desplegar nada.
--
-- REGLA DE NEGOCIO (spec §8): para cada persona ACTIVA y cada tema OBLIGATORIO ACTIVO que le corresponde según su
--   puesto ACTUAL, y que vence (tiene periodicidad): última capacitación APROBADA (de una capacitación no anulada)
--   + periodicidad del tema en meses = fecha de vencimiento.
--   Se devuelven: vencidas, las que vencen dentro de p_dias (default 15) y quienes NUNCA lo aprobaron
--   (decidido con Lucas, 2026-10-17: es el caso más urgente).
-- REGLA DE NEGOCIO: NO envía emails ni notificaciones (fuera de presupuesto, acordado el 25/09): es un panel.
-- La fecha de hoy es la de Argentina, no UTC.

create or replace function public.compliance_upcoming(
  p_dias integer default 15,
  p_position_id uuid default null,
  p_topic_id uuid default null
)
returns table (
  person_id uuid,
  dni text,
  nombre text,
  apellido text,
  position_id uuid,
  puesto_nombre text,
  topic_id uuid,
  tema_nombre text,
  periodicidad_meses integer,
  ultimo_aprobado date,
  vence_el date,
  estado text,          -- 'nunca' | 'vencida' | 'por_vencer'
  dias_restantes integer -- negativo si ya venció; null si nunca lo aprobó
)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_hoy date := (pg_catalog.now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  -- PERMISOS (spec §8): Gerente y Capacitador ven el panel completo. security definer: se chequea a mano.
  if coalesce(public.auth_role()::text, '') not in ('gerente', 'capacitador') then
    raise exception 'No tenés permiso para ver los vencimientos' using errcode = '42501';
  end if;
  if p_dias is null or p_dias < 0 or p_dias > 365 then
    raise exception 'El rango de días tiene que estar entre 0 y 365' using errcode = 'P0001';
  end if;

  return query
  with requeridos as (
    select p.id as person_id, p.dni, p.nombre, p.apellido, p.position_id, pos.nombre as puesto_nombre,
           t.id as topic_id, t.nombre as tema_nombre, t.periodicidad_meses
    from public.personnel p
    join public.positions pos on pos.id = p.position_id
    join public.training_topic_positions tp on tp.position_id = p.position_id
    join public.training_topics t on t.id = tp.topic_id
    where p.activo
      and t.activo
      and t.tipo = 'obligatorio'
      and t.periodicidad_meses is not null
      and (p_position_id is null or p.position_id = p_position_id)
      and (p_topic_id is null or t.id = p_topic_id)
  ),
  ultimos as (
    -- Cuenta cualquier capacitación aprobada del tema, le correspondiera o no en ese momento.
    select ta.person_id, tr.topic_id, max(tr.fecha_dictado) as ultimo
    from public.training_attendees ta
    join public.trainings tr on tr.id = ta.training_id
    where ta.resultado = 'aprobado' and tr.estado = 'activa'
    group by ta.person_id, tr.topic_id
  ),
  calculado as (
    select r.*, u.ultimo,
           (u.ultimo + pg_catalog.make_interval(months => r.periodicidad_meses))::date as vence
    from requeridos r
    left join ultimos u on u.person_id = r.person_id and u.topic_id = r.topic_id
  )
  select c.person_id, c.dni, c.nombre, c.apellido, c.position_id, c.puesto_nombre,
         c.topic_id, c.tema_nombre, c.periodicidad_meses,
         c.ultimo, c.vence,
         case
           when c.ultimo is null then 'nunca'
           when c.vence < v_hoy then 'vencida'
           else 'por_vencer'
         end,
         (c.vence - v_hoy)
  from calculado c
  where c.ultimo is null or c.vence <= v_hoy + p_dias
  order by c.tema_nombre, c.vence nulls first, c.apellido, c.nombre;
end;
$$;

revoke all on function public.compliance_upcoming(integer, uuid, uuid) from public, anon;
grant execute on function public.compliance_upcoming(integer, uuid, uuid) to authenticated;

-- TODO(SETUP): sumar al test: anon no ejecuta compliance_upcoming; una capacitación anulada no cuenta como aprobada;
--   persona inactiva y temas electivos / sin periodicidad / inactivos no aparecen; p_dias fuera de rango → P0001.
