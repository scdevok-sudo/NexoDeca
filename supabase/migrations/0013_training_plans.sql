create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  anio integer not null unique check (anio between 2020 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger training_plans_set_updated_at
  before update on public.training_plans
  for each row execute function public.set_updated_at();

create table public.training_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  topic_id uuid not null references public.training_topics(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (plan_id, mes, topic_id)
);

alter table public.training_plans enable row level security;
alter table public.training_plan_items enable row level security;

revoke all on public.training_plans from anon;
revoke all on public.training_plan_items from anon;

grant select, insert, update on public.training_plans to authenticated;
grant select, insert, delete on public.training_plan_items to authenticated;

create policy training_plans_select on public.training_plans
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));

create policy training_plans_insert on public.training_plans
  for insert to authenticated
  with check (public.auth_role() = 'gerente');

create policy training_plans_update on public.training_plans
  for update to authenticated
  using (public.auth_role() = 'gerente')
  with check (public.auth_role() = 'gerente');

create policy training_plan_items_select on public.training_plan_items
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));

create policy training_plan_items_insert on public.training_plan_items
  for insert to authenticated
  with check (public.auth_role() = 'gerente');

create policy training_plan_items_delete on public.training_plan_items
  for delete to authenticated
  using (public.auth_role() = 'gerente');
