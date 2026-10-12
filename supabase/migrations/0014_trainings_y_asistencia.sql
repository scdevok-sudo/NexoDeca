create type public.training_result as enum ('aprobado', 'no_aprobado');
create type public.training_status as enum ('activa', 'anulada');
create type public.attendee_relevance as enum ('obligatorio', 'electivo', 'no_correspondia');

create sequence public.training_numero_registro_seq;

create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  numero_registro bigint not null unique default nextval('public.training_numero_registro_seq'),
  topic_id uuid not null references public.training_topics(id) on delete restrict,
  fecha_dictado date not null,
  capacitador_id uuid not null references public.profiles(id) on delete restrict,
  duracion_real numeric(5,2) not null check (duracion_real > 0),
  temario text,
  estado public.training_status not null default 'activa',
  tiene_certificados boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.training_numero_registro_seq owned by public.trainings.numero_registro;

create trigger trainings_set_updated_at
  before update on public.trainings
  for each row execute function public.set_updated_at();

create table public.training_attendees (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete restrict,
  person_id uuid not null references public.personnel(id) on delete restrict,
  puesto_id_snapshot uuid not null references public.positions(id) on delete restrict,
  resultado public.training_result not null,
  correspondencia public.attendee_relevance not null,
  created_at timestamptz not null default now(),
  unique (training_id, person_id)
);

alter table public.trainings enable row level security;
alter table public.training_attendees enable row level security;

revoke all on public.trainings from anon;
revoke all on public.training_attendees from anon;

-- Grants a nivel de columna: el cliente autenticado nunca puede setear
-- numero_registro, estado ni tiene_certificados a mano (insert) ni tocarlos
-- despues (update) -- eso queda solo para la service_role de las Edge Functions.
grant select on public.trainings to authenticated;
grant insert (topic_id, fecha_dictado, capacitador_id, duracion_real, temario)
  on public.trainings to authenticated;
grant update (topic_id, fecha_dictado, duracion_real, temario)
  on public.trainings to authenticated;

grant select, insert on public.training_attendees to authenticated;
grant update (resultado, correspondencia) on public.training_attendees to authenticated;

create policy trainings_select_gerente on public.trainings
  for select to authenticated
  using (public.auth_role() = 'gerente');

create policy trainings_select_capacitador_own on public.trainings
  for select to authenticated
  using (public.auth_role() = 'capacitador' and capacitador_id = auth.uid());

create policy trainings_insert on public.trainings
  for insert to authenticated
  with check (
    public.auth_role() in ('gerente', 'capacitador')
    and capacitador_id = auth.uid()
  );

create policy trainings_update_capacitador_own on public.trainings
  for update to authenticated
  using (
    public.auth_role() = 'capacitador'
    and capacitador_id = auth.uid()
    and estado = 'activa'
    and not tiene_certificados
  )
  with check (capacitador_id = auth.uid());

create policy trainings_update_gerente on public.trainings
  for update to authenticated
  using (public.auth_role() = 'gerente')
  with check (public.auth_role() = 'gerente');

create policy training_attendees_select on public.training_attendees
  for select to authenticated
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_attendees.training_id
        and (
          public.auth_role() = 'gerente'
          or (public.auth_role() = 'capacitador' and t.capacitador_id = auth.uid())
        )
    )
  );

create policy training_attendees_insert on public.training_attendees
  for insert to authenticated
  with check (
    exists (
      select 1 from public.trainings t
      where t.id = training_attendees.training_id
        and t.capacitador_id = auth.uid()
        and t.estado = 'activa'
        and not t.tiene_certificados
    )
  );

create policy training_attendees_update on public.training_attendees
  for update to authenticated
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_attendees.training_id
        and t.capacitador_id = auth.uid()
        and t.estado = 'activa'
        and not t.tiene_certificados
    )
  )
  with check (
    exists (
      select 1 from public.trainings t
      where t.id = training_attendees.training_id
        and t.capacitador_id = auth.uid()
    )
  );
