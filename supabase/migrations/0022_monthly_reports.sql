-- 0022_monthly_reports.sql
-- Módulo: M9 · Reporte Mensual para YPF (spec §9)
-- Implementa lo que 0007 dejó comentado (la tabla nunca se creó). Depende de 0010 (profiles, auth_role) y del
--   bucket privado 'reportes-mensuales' (0016).
-- Nombres en español como en 0013 (anio, mes), no year/month como en el comentario de 0007.

-- ============================================================
-- monthly_reports — historial de reportes generados
-- ============================================================
-- REGLA DE NEGOCIO (spec §9): cada reporte generado se guarda como archivo histórico (no se regenera al vuelo) para
--   poder reconstruir exactamente lo que se le entregó a YPF.
-- REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): generar el mismo mes otra vez crea una VERSIÓN NUEVA; la
--   anterior queda. Nunca se pisa ni se borra un reporte.
-- Formato: Excel (.xlsx), según docs/decisiones-tecnicas.md.
create table public.monthly_reports (
  id                      uuid primary key default gen_random_uuid(),
  anio                    integer not null check (anio between 2020 and 2100),
  mes                     integer not null check (mes between 1 and 12),
  version                 integer not null check (version >= 1),
  formato                 text not null default 'xlsx' check (formato = 'xlsx'),
  storage_path            text not null unique,
  generado_por            uuid not null references public.profiles (id) on delete restrict,
  cantidad_capacitaciones integer not null check (cantidad_capacitaciones >= 0),
  cantidad_participantes  integer not null check (cantidad_participantes >= 0),
  created_at              timestamptz not null default now(),
  unique (anio, mes, version)
);

create index monthly_reports_anio_mes_idx on public.monthly_reports (anio, mes);

-- ============================================================
-- RLS
-- ============================================================
-- PERMISOS (spec §9): Gerente y Capacitador ven todo el historial. Nadie escribe desde el cliente: los registra
--   solo la Edge Function monthly-report (service_role) a través de register_monthly_report. Sin update ni delete.
alter table public.monthly_reports enable row level security;
revoke all on public.monthly_reports from anon, authenticated;
grant select on public.monthly_reports to authenticated;

create policy monthly_reports_select on public.monthly_reports
  for select to authenticated
  using (public.auth_role() in ('gerente', 'capacitador'));

-- ============================================================
-- Registrar un reporte con su número de versión
-- ============================================================
-- La llama SOLO la Edge Function monthly-report (service_role), después de subir el archivo al bucket.
-- El lock por (año, mes) evita que dos generaciones simultáneas del mismo mes tomen el mismo número de versión.
create or replace function public.register_monthly_report(
  p_anio integer,
  p_mes integer,
  p_storage_path text,
  p_generado_por uuid,
  p_capacitaciones integer,
  p_participantes integer
)
returns table (id uuid, version integer)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_version integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(p_anio * 100 + p_mes);
  select coalesce(max(r.version), 0) + 1 into v_version
  from public.monthly_reports r
  where r.anio = p_anio and r.mes = p_mes;

  return query
  insert into public.monthly_reports
    (anio, mes, version, storage_path, generado_por, cantidad_capacitaciones, cantidad_participantes)
  values (p_anio, p_mes, v_version, p_storage_path, p_generado_por, p_capacitaciones, p_participantes)
  returning monthly_reports.id, monthly_reports.version;
end;
$$;
revoke all on function public.register_monthly_report(integer, integer, text, uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.register_monthly_report(integer, integer, text, uuid, integer, integer)
  to service_role;

-- ============================================================
-- Bucket de reportes: solo .xlsx y tamaño acotado
-- ============================================================
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
where id = 'reportes-mensuales';

-- TODO(SETUP): sumar al test: authenticated no inserta en monthly_reports ni ejecuta register_monthly_report;
--   capacitador y gerente leen el historial; anon no lee nada; dos registros del mismo mes → versiones 1 y 2.
