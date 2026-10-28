-- 0025_monthly_reports_pdf.sql
-- Módulo: M9 · Reporte Mensual para YPF (spec §9)
-- Habilita el reporte también en PDF (además del Excel de 0022): formato 'xlsx' | 'pdf'.
--
-- REGLA DE NEGOCIO (decidido con Lucas, 2026-10-17): nunca se pisa un reporte. La versión es por (año, mes) y se
--   comparte entre formatos: generar el mismo mes en otro formato también crea una versión nueva (v1 xlsx, v2 pdf…).

-- ============================================================
-- Formatos permitidos
-- ============================================================
alter table public.monthly_reports drop constraint monthly_reports_formato_check;
alter table public.monthly_reports
  add constraint monthly_reports_formato_check check (formato in ('xlsx', 'pdf'));

-- ============================================================
-- register_monthly_report: recibe el formato
-- ============================================================
-- Se reemplaza la función de 0022 (sin p_formato). La sigue llamando SOLO la Edge Function monthly-report.
drop function public.register_monthly_report(integer, integer, text, uuid, integer, integer);

create or replace function public.register_monthly_report(
  p_anio integer,
  p_mes integer,
  p_storage_path text,
  p_generado_por uuid,
  p_capacitaciones integer,
  p_participantes integer,
  p_formato text default 'xlsx'
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
    (anio, mes, version, formato, storage_path, generado_por, cantidad_capacitaciones, cantidad_participantes)
  values (p_anio, p_mes, v_version, p_formato, p_storage_path, p_generado_por, p_capacitaciones, p_participantes)
  returning monthly_reports.id, monthly_reports.version;
end;
$$;
revoke all on function public.register_monthly_report(integer, integer, text, uuid, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.register_monthly_report(integer, integer, text, uuid, integer, integer, text)
  to service_role;

-- ============================================================
-- Bucket de reportes: .xlsx y .pdf
-- ============================================================
update storage.buckets
set allowed_mime_types = array[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf'
    ]
where id = 'reportes-mensuales';
