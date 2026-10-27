-- 0024_certificado_rediseno.sql
-- Módulo: M7 · Certificados (rediseño del PDF + verificación pública por QR)
-- Depende de 0015 (certificates), 0016 (buckets), 0020 (finalize_certificates) y 0003 (training_topics).
-- Convención: no se editan migraciones ya aplicadas; todo cambio va en una nueva.
--
-- Qué agrega:
--  1. finalize_certificates acepta un "id" opcional por ítem: la Edge Function necesita saber el UUID del
--     certificado ANTES de armar el PDF (el QR apunta a /certificado/<id>).
--  2. certificate_signature_settings: firma del Responsable de Seguridad e Higiene (una sola fila).
--  3. Bucket privado 'firmas-certificados' para la imagen de la firma.
--  4. get_certificate_public: datos mínimos para verificar un certificado por id (solo service_role).

-- ============================================================
-- 1. finalize_certificates con id opcional
-- ============================================================
-- p_items: [{ "attendee_id": uuid, "storage_path": text, "id": uuid (opcional) }, ...]
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

  insert into public.certificates (id, training_attendee_id, numero_registro, storage_path)
  select coalesce((i->>'id')::uuid, gen_random_uuid()), (i->>'attendee_id')::uuid, v.numero_registro, i->>'storage_path'
  from pg_catalog.jsonb_array_elements(p_items) i;

  update public.trainings set tiene_certificados = true where id = p_training_id;
end;
$$;
revoke all on function public.finalize_certificates(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_certificates(uuid, jsonb) to service_role;

-- ============================================================
-- 2. Firma del Responsable de Seguridad e Higiene
-- ============================================================
-- Una sola fila (id = 1). Si no hay nombre cargado, el certificado deja la línea de firma en blanco.
-- REGLA DE NEGOCIO (decidido con Santi): es una imagen estática cargada por el Gerente, NO firma digital.
-- PERMISOS: solo el Gerente lee y escribe desde el cliente. La Edge Function usa la service role.
create table public.certificate_signature_settings (
  id smallint primary key default 1 check (id = 1),
  responsable_nombre text,
  responsable_cargo text,
  responsable_matricula text,
  responsable_firma_path text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.certificate_signature_settings enable row level security;
revoke all on public.certificate_signature_settings from anon;
grant select, insert, update on public.certificate_signature_settings to authenticated;

create policy cert_signature_select on public.certificate_signature_settings
  for select to authenticated using (public.auth_role() = 'gerente');
create policy cert_signature_insert on public.certificate_signature_settings
  for insert to authenticated with check (public.auth_role() = 'gerente');
create policy cert_signature_update on public.certificate_signature_settings
  for update to authenticated using (public.auth_role() = 'gerente') with check (public.auth_role() = 'gerente');

-- ============================================================
-- 3. Bucket de la imagen de firma
-- ============================================================
-- Privado, solo PNG, 512 KB. A diferencia de los certificados, la firma SÍ se puede reemplazar (upsert):
-- es configuración, no un documento histórico. Los PDF ya generados la llevan incrustada y no cambian.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('firmas-certificados', 'firmas-certificados', false, 524288, array['image/png'])
on conflict (id) do nothing;

create policy firmas_certificados_select on storage.objects
  for select to authenticated using (bucket_id = 'firmas-certificados' and public.auth_role() = 'gerente');
create policy firmas_certificados_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'firmas-certificados' and public.auth_role() = 'gerente');
create policy firmas_certificados_update on storage.objects
  for update to authenticated
  using (bucket_id = 'firmas-certificados' and public.auth_role() = 'gerente')
  with check (bucket_id = 'firmas-certificados' and public.auth_role() = 'gerente');

-- ============================================================
-- 4. Verificación pública por id (QR)
-- ============================================================
-- La llama SOLO la Edge Function certificate-verify (service_role).
-- REGLA DE NEGOCIO: datos mínimos para confirmar autenticidad; sin DNI ni URL del PDF.
-- Vigencia = fecha de dictado + periodicidad_meses del tema (null si el tema no vence).
create or replace function public.get_certificate_public(p_id uuid)
returns table (
  nombre text,
  apellido text,
  tema text,
  fecha_dictado date,
  numero_registro bigint,
  estado text,
  vence_el date
)
language sql security definer stable set search_path = ''
as $$
  select
    p.nombre,
    p.apellido,
    tt.nombre,
    t.fecha_dictado,
    c.numero_registro,
    c.estado::text,
    (t.fecha_dictado + pg_catalog.make_interval(months => tt.periodicidad_meses))::date
  from public.certificates c
  join public.training_attendees ta on ta.id = c.training_attendee_id
  join public.trainings t on t.id = ta.training_id
  join public.training_topics tt on tt.id = t.topic_id
  join public.personnel p on p.id = ta.person_id
  where c.id = p_id;
$$;
revoke all on function public.get_certificate_public(uuid) from public, anon, authenticated;
grant execute on function public.get_certificate_public(uuid) to service_role;
