create type public.certificate_status as enum ('vigente', 'reemplazado');

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  training_attendee_id uuid not null references public.training_attendees(id) on delete restrict,
  numero_registro bigint not null,
  storage_path text not null,
  estado public.certificate_status not null default 'vigente',
  reemplaza_a uuid references public.certificates(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Un solo certificado "vigente" por asistencia a la vez (el PDF viejo
-- queda como historico con estado='reemplazado', nunca se sobreescribe).
create unique index certificates_attendee_vigente_key
  on public.certificates (training_attendee_id)
  where estado = 'vigente';

alter table public.certificates enable row level security;
revoke all on public.certificates from anon;

-- Sin insert/update/delete para authenticated: los certificados los genera
-- unicamente la Edge Function de certificados con la service_role key.
grant select on public.certificates to authenticated;

create policy certificates_select on public.certificates
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));

-- Consulta publica (sin login) por DNI exacto -- nunca una policy de select
-- abierta a anon sobre la tabla: siempre a traves de esta funcion, que no
-- acepta busqueda parcial ni devuelve otra cosa que no sea de ese DNI.
create or replace function public.get_certificates_by_dni(p_dni text)
returns table (
  certificate_id uuid,
  numero_registro bigint,
  tema text,
  fecha_dictado date,
  storage_path text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.id,
    c.numero_registro,
    tt.nombre,
    t.fecha_dictado,
    c.storage_path,
    c.created_at
  from public.certificates c
  join public.training_attendees ta on ta.id = c.training_attendee_id
  join public.trainings t on t.id = ta.training_id
  join public.training_topics tt on tt.id = t.topic_id
  join public.personnel p on p.id = ta.person_id
  where c.estado = 'vigente'
    and p.dni = btrim(p_dni)
  order by t.fecha_dictado desc;
$$;

revoke all on function public.get_certificates_by_dni(text) from public;
grant execute on function public.get_certificates_by_dni(text) to anon, authenticated;
