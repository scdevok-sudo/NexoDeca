create type public.topic_type as enum ('obligatorio', 'electivo');

create table public.training_topics (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) > 0),
  tipo public.topic_type not null,
  periodicidad_meses integer check (periodicidad_meses is null or periodicidad_meses > 0),
  duracion_horas numeric(5,2) not null check (duracion_horas > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index training_topics_nombre_lower_key
  on public.training_topics (lower(btrim(nombre)));

create trigger training_topics_set_updated_at
  before update on public.training_topics
  for each row execute function public.set_updated_at();

create table public.training_topic_positions (
  topic_id uuid not null references public.training_topics(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  primary key (topic_id, position_id)
);

alter table public.training_topics enable row level security;
alter table public.training_topic_positions enable row level security;

revoke all on public.training_topics from anon;
revoke all on public.training_topic_positions from anon;

grant select, insert, update on public.training_topics to authenticated;
grant select, insert, delete on public.training_topic_positions to authenticated;

create policy training_topics_select on public.training_topics
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));

create policy training_topics_insert on public.training_topics
  for insert to authenticated
  with check (public.auth_role() = 'gerente');

create policy training_topics_update on public.training_topics
  for update to authenticated
  using (public.auth_role() = 'gerente')
  with check (public.auth_role() = 'gerente');

create policy training_topic_positions_select on public.training_topic_positions
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));

create policy training_topic_positions_insert on public.training_topic_positions
  for insert to authenticated
  with check (public.auth_role() = 'gerente');

create policy training_topic_positions_delete on public.training_topic_positions
  for delete to authenticated
  using (public.auth_role() = 'gerente');
