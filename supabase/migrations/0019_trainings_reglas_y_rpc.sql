-- 0019_trainings_reglas_y_rpc.sql
-- Módulo: M6 · Dictado de Capacitaciones y Registro de Asistencia (spec §6)
-- Depende de 0010 (profiles, personnel, auth_role), 0011 (positions), 0012 (training_topics, training_topic_positions)
--   y 0014 (trainings, training_attendees). Numerada 0019: 0017 es de M3 (positions) y 0018 de M5 (plan).
-- Convención: no se editan migraciones ya aplicadas; todo cambio va en una nueva.
--
-- Qué agrega:
--  1. Reglas en triggers (valen para cualquier camino de escritura): fecha no futura, tema activo, persona activa,
--     y el puesto + la correspondencia de cada asistente los calcula el SERVIDOR (no se aceptan del cliente).
--  2. Tres RPC (create_training, update_training, void_training): cada una es UNA transacción. Crear una capacitación
--     y sus asistentes por separado podía dejar un nro de registro consumido sin asistentes.
--  3. El cliente ya no escribe directo en trainings / training_attendees: todo pasa por las RPC.
--
-- Errores: P0001 → 400 con el mensaje tal cual (lib/apiError.ts). Para 404 y 409 se usa HINT '404' / '409'
--   (lo traduce src/modules/trainings/api.ts). 42501 → 403.

-- ============================================================
-- Helper: correspondencia de un tema para un puesto
-- ============================================================
-- REGLA DE NEGOCIO (spec §6): si el puesto está entre los puestos del tema → el tipo del tema (obligatorio/electivo);
--   si no → 'no_correspondia' (alerta, NO bloqueo).
create or replace function public.training_relevance(p_topic_id uuid, p_position_id uuid)
returns public.attendee_relevance
language sql stable security definer set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.training_topic_positions tp
      where tp.topic_id = p_topic_id and tp.position_id = p_position_id
    )
      then (select t.tipo::text from public.training_topics t where t.id = p_topic_id)::public.attendee_relevance
    else 'no_correspondia'::public.attendee_relevance
  end
$$;
revoke all on function public.training_relevance(uuid, uuid) from public, anon, authenticated;

-- ============================================================
-- Trigger: validaciones de la capacitación
-- ============================================================
-- REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): se registran capacitaciones YA dictadas → la fecha no puede ser
--   futura (fecha de Argentina, no UTC). Solo temas activos para lo nuevo (mismo criterio que el plan, M5); si se
--   edita otra cosa de una capacitación cuyo tema se desactivó después, no falla.
create or replace function public.trainings_validate()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.fecha_dictado > (pg_catalog.now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'La fecha de dictado no puede ser futura' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' or new.topic_id is distinct from old.topic_id then
    if not exists (select 1 from public.training_topics t where t.id = new.topic_id and t.activo) then
      raise exception 'El tema seleccionado no existe o está inactivo' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.trainings_validate() from public, anon, authenticated;

create trigger trainings_validate
  before insert or update of fecha_dictado, topic_id on public.trainings
  for each row execute function public.trainings_validate();

-- ============================================================
-- Trigger: datos de cada asistente
-- ============================================================
-- REGLA DE NEGOCIO (spec §2/§6): el puesto que se guarda es el que la persona tenía AL MOMENTO del curso (copia, no
--   referencia viva) y la correspondencia la calcula el servidor. Lo que mande el cliente en esas columnas se pisa.
-- REGLA DE NEGOCIO: personas inactivas no se pueden incorporar a capacitaciones.
create or replace function public.training_attendees_fill()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_pos uuid;
  v_activo boolean;
  v_dni text;
  v_topic uuid;
begin
  select p.position_id, p.activo, p.dni into v_pos, v_activo, v_dni from public.personnel p where p.id = new.person_id;
  if not found then
    raise exception 'Alguna de las personas seleccionadas no existe' using errcode = 'P0001';
  end if;
  if not v_activo then
    raise exception 'La persona con DNI % está inactiva: no se puede cargar en una capacitación', v_dni
      using errcode = 'P0001';
  end if;
  select t.topic_id into v_topic from public.trainings t where t.id = new.training_id;
  new.puesto_id_snapshot := v_pos;
  new.correspondencia := public.training_relevance(v_topic, v_pos);
  return new;
end;
$$;
revoke all on function public.training_attendees_fill() from public, anon, authenticated;

create trigger training_attendees_fill
  before insert on public.training_attendees
  for each row execute function public.training_attendees_fill();

-- ============================================================
-- Helper: validar la lista de asistentes que llega en JSON
-- ============================================================
-- Formato: [{ "person_id": uuid, "resultado": "aprobado" | "no_aprobado" }, ...]
create or replace function public.training_check_attendees(p_asistentes jsonb)
returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if p_asistentes is null or pg_catalog.jsonb_typeof(p_asistentes) <> 'array'
     or pg_catalog.jsonb_array_length(p_asistentes) = 0 then
    -- REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): al menos un asistente.
    raise exception 'Cargá al menos un asistente' using errcode = 'P0001';
  end if;
  if (select count(distinct a->>'person_id') from pg_catalog.jsonb_array_elements(p_asistentes) a)
     <> pg_catalog.jsonb_array_length(p_asistentes) then
    raise exception 'Hay personas repetidas en la lista de asistentes' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function public.training_check_attendees(jsonb) from public, anon, authenticated;

-- ============================================================
-- RPC: POST /trainings
-- ============================================================
-- PERMISOS: Capacitador, y el Gerente solo como capacitador de la propia (decidido con Lucas, 2026-10-17).
--   El capacitador responsable es SIEMPRE quien la carga (auth.uid()); no se puede cargar a nombre de otro.
-- REGLA DE NEGOCIO: el nro de registro sale de la secuencia (0014), nunca del cliente.
--   TODO(consultar a Santi): si algo falla después del nextval, la transacción se revierte pero el número queda
--   consumido (hueco). La spec pide "sin huecos" en lo que llega a los certificados (decisión pendiente #16).
create or replace function public.create_training(
  p_topic_id uuid,
  p_fecha date,
  p_duracion numeric,
  p_temario text,
  p_asistentes jsonb
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(public.auth_role()::text, '') not in ('gerente', 'capacitador') then
    raise exception 'No tenés permiso para cargar capacitaciones' using errcode = '42501';
  end if;
  perform public.training_check_attendees(p_asistentes);

  insert into public.trainings (topic_id, fecha_dictado, capacitador_id, duracion_real, temario)
  values (p_topic_id, p_fecha, auth.uid(), p_duracion, nullif(pg_catalog.btrim(p_temario), ''))
  returning id into v_id;

  -- puesto_id_snapshot y correspondencia los completa el trigger training_attendees_fill.
  insert into public.training_attendees (training_id, person_id, resultado, puesto_id_snapshot, correspondencia)
  select v_id, (a->>'person_id')::uuid, (a->>'resultado')::public.training_result, null, null
  from pg_catalog.jsonb_array_elements(p_asistentes) a;

  return v_id;
end;
$$;

-- ============================================================
-- RPC: PUT /trainings/{id}
-- ============================================================
-- PERMISOS: solo quien la cargó (Capacitador o Gerente), mientras esté activa y sin certificados (409).
--   El Gerente NO edita capacitaciones de otros (decidido con Lucas, 2026-10-17).
-- Asistentes: se deja la lista exactamente como viene. Los que siguen conservan su puesto histórico (se actualiza
--   el resultado y, si cambió el tema, se recalcula la correspondencia); los nuevos se calculan con su puesto
--   actual; los que se sacan se borran (solo es posible sin certificados: es corregir una carga por error).
create or replace function public.update_training(
  p_id uuid,
  p_topic_id uuid,
  p_fecha date,
  p_duracion numeric,
  p_temario text,
  p_asistentes jsonb
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v public.trainings%rowtype;
begin
  if coalesce(public.auth_role()::text, '') not in ('gerente', 'capacitador') then
    raise exception 'No tenés permiso para modificar capacitaciones' using errcode = '42501';
  end if;
  select * into v from public.trainings t where t.id = p_id for update;
  if not found or (public.auth_role() = 'capacitador' and v.capacitador_id <> auth.uid()) then
    raise exception 'La capacitación no existe' using errcode = 'P0001', hint = '404';
  end if;
  if v.capacitador_id <> auth.uid() then
    raise exception 'Solo quien cargó la capacitación puede editarla' using errcode = '42501';
  end if;
  if v.estado = 'anulada' then
    raise exception 'La capacitación está anulada: no se puede editar' using errcode = 'P0001', hint = '409';
  end if;
  if v.tiene_certificados then
    raise exception 'La capacitación ya tiene certificados generados: no se puede editar. Corregila con una capacitación nueva'
      using errcode = 'P0001', hint = '409';
  end if;
  perform public.training_check_attendees(p_asistentes);

  update public.trainings
  set topic_id = p_topic_id,
      fecha_dictado = p_fecha,
      duracion_real = p_duracion,
      temario = nullif(pg_catalog.btrim(p_temario), '')
  where id = p_id;

  delete from public.training_attendees ta
  where ta.training_id = p_id
    and ta.person_id not in (select (a->>'person_id')::uuid from pg_catalog.jsonb_array_elements(p_asistentes) a);

  update public.training_attendees ta
  set resultado = (a->>'resultado')::public.training_result,
      correspondencia = public.training_relevance(p_topic_id, ta.puesto_id_snapshot)
  from pg_catalog.jsonb_array_elements(p_asistentes) a
  where ta.training_id = p_id and ta.person_id = (a->>'person_id')::uuid;

  insert into public.training_attendees (training_id, person_id, resultado, puesto_id_snapshot, correspondencia)
  select p_id, (a->>'person_id')::uuid, (a->>'resultado')::public.training_result, null, null
  from pg_catalog.jsonb_array_elements(p_asistentes) a
  where not exists (
    select 1 from public.training_attendees ta
    where ta.training_id = p_id and ta.person_id = (a->>'person_id')::uuid
  );

  return p_id;
end;
$$;

-- ============================================================
-- RPC: POST /trainings/{id}/void
-- ============================================================
-- PERMISOS: el Capacitador anula las propias; el Gerente, cualquiera.
-- REGLA DE NEGOCIO: nunca DELETE físico (CLAUDE.md regla 6): se marca 'anulada' y el nro de registro no se reutiliza.
--   Con certificados generados no se anula (409): se corrige con una capacitación nueva.
create or replace function public.void_training(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.trainings%rowtype;
begin
  if coalesce(public.auth_role()::text, '') not in ('gerente', 'capacitador') then
    raise exception 'No tenés permiso para anular capacitaciones' using errcode = '42501';
  end if;
  select * into v from public.trainings t where t.id = p_id for update;
  if not found or (public.auth_role() = 'capacitador' and v.capacitador_id <> auth.uid()) then
    raise exception 'La capacitación no existe' using errcode = 'P0001', hint = '404';
  end if;
  if v.estado = 'anulada' then
    raise exception 'La capacitación ya está anulada' using errcode = 'P0001', hint = '409';
  end if;
  if v.tiene_certificados then
    raise exception 'La capacitación ya tiene certificados generados: no se puede anular. Corregila con una capacitación nueva'
      using errcode = 'P0001', hint = '409';
  end if;
  update public.trainings set estado = 'anulada' where id = p_id;
end;
$$;

revoke all on function public.create_training(uuid, date, numeric, text, jsonb) from public, anon;
revoke all on function public.update_training(uuid, uuid, date, numeric, text, jsonb) from public, anon;
revoke all on function public.void_training(uuid) from public, anon;
grant execute on function public.create_training(uuid, date, numeric, text, jsonb) to authenticated;
grant execute on function public.update_training(uuid, uuid, date, numeric, text, jsonb) to authenticated;
grant execute on function public.void_training(uuid) to authenticated;

-- ============================================================
-- El cliente ya no escribe directo: todo por las RPC de arriba
-- ============================================================
-- Así nadie puede, por ejemplo, crear una capacitación sin asistentes o cambiar el resultado de una ya certificada
--   salteándose las validaciones de las RPC. La lectura (select + RLS de 0014) no cambia. Las policies de
--   insert/update de 0014 quedan sin efecto (sin grant no se llega a evaluarlas).
revoke insert, update on public.trainings from authenticated;
revoke insert, update on public.training_attendees from authenticated;

-- TODO(SETUP): sumar al test por rol: fecha futura → P0001; tema inactivo → P0001; persona inactiva → P0001;
--   correspondencia calculada aunque el cliente mande otra; capacitador no edita ni anula ajenas (404);
--   gerente no edita ajenas (403) pero sí anula; con tiene_certificados → hint 409; insert directo → 42501.
