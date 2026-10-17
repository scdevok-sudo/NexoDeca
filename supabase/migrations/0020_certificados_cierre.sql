-- 0020_certificados_cierre.sql
-- Módulo: M7 · Certificados (spec §7)
-- Depende de 0014 (trainings, training_attendees), 0015 (certificates, get_certificates_by_dni) y 0019 (void_training).
-- Convención: no se editan migraciones ya aplicadas; todo cambio va en una nueva.
--
-- Qué agrega:
--  1. Estado 'anulado' para certificados (los de una capacitación anulada dejan de estar vigentes; el PDF se conserva).
--  2. finalize_certificates: registra los certificados generados por la Edge Function y "cierra" la capacitación
--     (tiene_certificados = true), todo en una transacción. Solo la service_role.
--  3. void_training ahora permite anular una capacitación con certificados (y anula sus certificados).
--  4. get_certificates_by_dni deja de ser ejecutable desde el cliente: la consulta pública pasa SIEMPRE por la Edge
--     Function certificates-by-dni (que valida el DNI y firma las URLs de descarga).

-- ============================================================
-- 1. Estado 'anulado'
-- ============================================================
-- REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): un error en una capacitación certificada se corrige anulándola
--   y registrando una nueva. Sus certificados pasan a 'anulado': no se muestran en la consulta por DNI (que filtra
--   'vigente'), pero el registro y el PDF quedan (auditoría YPF; nunca se borra un PDF).
-- Nota: el valor nuevo solo se usa dentro de funciones plpgsql (se evalúa al ejecutarlas, no al crearlas).
alter type public.certificate_status add value if not exists 'anulado';

-- ============================================================
-- 2. Cierre: registrar los certificados generados
-- ============================================================
-- La llama SOLO la Edge Function generate-certificates (service_role), después de subir los PDF al bucket.
-- p_items: [{ "attendee_id": uuid, "storage_path": text }, ...] — uno por asistente aprobado.
-- REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): el "cierre" es explícito (botón "Cerrar y generar
--   certificados"). Cerrada = tiene_certificados: desde ahí no se edita (0019).
-- REGLA DE NEGOCIO: el número del certificado es el nro de registro de la capacitación.
create or replace function public.finalize_certificates(p_training_id uuid, p_items jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.trainings%rowtype;
begin
  select * into v from public.trainings t where t.id = p_training_id for update;
  if not found then
    raise exception 'La capacitación no existe' using errcode = 'P0001', hint = '404';
  end if;
  if v.estado = 'anulada' then
    raise exception 'La capacitación está anulada: no se generan certificados' using errcode = 'P0001', hint = '409';
  end if;
  if v.tiene_certificados then
    raise exception 'La capacitación ya tiene certificados generados' using errcode = 'P0001', hint = '409';
  end if;
  if p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array' or pg_catalog.jsonb_array_length(p_items) = 0 then
    raise exception 'No hay certificados para registrar' using errcode = 'P0001';
  end if;
  -- Solo asistentes aprobados de ESTA capacitación (defensa por si la Edge Function manda algo de más).
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_items) i
    where not exists (
      select 1 from public.training_attendees ta
      where ta.id = (i->>'attendee_id')::uuid and ta.training_id = p_training_id and ta.resultado = 'aprobado'
    )
  ) then
    raise exception 'Hay certificados de asistentes que no aprobaron esta capacitación' using errcode = 'P0001';
  end if;

  insert into public.certificates (training_attendee_id, numero_registro, storage_path)
  select (i->>'attendee_id')::uuid, v.numero_registro, i->>'storage_path'
  from pg_catalog.jsonb_array_elements(p_items) i;

  update public.trainings set tiene_certificados = true where id = p_training_id;
end;
$$;
revoke all on function public.finalize_certificates(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_certificates(uuid, jsonb) to service_role;

-- ============================================================
-- 3. Anular con certificados
-- ============================================================
-- Reemplaza la versión de 0019. Cambia solo el caso "tiene certificados": antes 409, ahora se anula y sus
--   certificados vigentes pasan a 'anulado'. Editar con certificados sigue bloqueado (update_training, 0019).
-- PERMISOS: el Capacitador anula las propias; el Gerente, cualquiera.
-- REGLA DE NEGOCIO: nunca DELETE físico (CLAUDE.md regla 6); el nro de registro no se reutiliza.
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

  update public.trainings set estado = 'anulada' where id = p_id;

  update public.certificates c
  set estado = 'anulado'
  from public.training_attendees ta
  where ta.id = c.training_attendee_id and ta.training_id = p_id and c.estado = 'vigente';
end;
$$;

-- ============================================================
-- 4. Consulta pública solo por la Edge Function
-- ============================================================
-- PERMISOS: antes la podía ejecutar anon directo (0015). Ahora solo service_role: la Edge Function
--   certificates-by-dni normaliza el DNI, responde igual exista o no, firma las URLs y es donde va el rate limiting.
revoke execute on function public.get_certificates_by_dni(text) from anon, authenticated;
grant execute on function public.get_certificates_by_dni(text) to service_role;

-- ============================================================
-- 5. Bucket de certificados: solo PDF y tamaño acotado
-- ============================================================
-- Cierra el TODO(M7) de 0009. Un certificado de una página pesa pocos KB: 1 MB sobra.
update storage.buckets
set file_size_limit = 1048576,
    allowed_mime_types = array['application/pdf']
where id = 'certificados-pdf';

-- TODO(SETUP): sumar al test: finalize_certificates no la ejecuta authenticated; con certificados, update_training
--   → hint 409 y void_training anula la capacitación y deja sus certificados en 'anulado'; anon no ejecuta
--   get_certificates_by_dni.
