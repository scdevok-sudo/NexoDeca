-- 0018_plan_tema_activo.sql
-- Módulo: M5 · Plan Anual de Capacitación (spec §5)
-- Depende de 0012 (training_topics) y 0013 (training_plan_items).
-- Numerada 0018 porque 0017_positions.sql (M3) ya usa el 0017.

-- ============================================================
-- Solo temas activos al planificar
-- ============================================================
-- REGLA DE NEGOCIO (spec §4/§5): un tema inactivo no puede incorporarse a un plan nuevo (PUT → 400).
-- Solo en INSERT: training_plan_items no se actualiza (solo insert/delete), y un tema que ya estaba planificado y
--   después se desactivó queda donde está (el plan es histórico).
-- security definer + search_path vacío, mismo criterio que ensure_position_active (0017): solo hace un EXISTS.
-- El RAISE EXCEPTION sale como P0001 y el frontend muestra el mensaje tal cual (lib/apiError.ts).
create or replace function public.ensure_topic_active()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.training_topics t where t.id = new.topic_id and t.activo) then
    raise exception 'El tema seleccionado no existe o está inactivo' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.ensure_topic_active() from public, anon, authenticated;

create trigger training_plan_items_ensure_topic_active
  before insert on public.training_plan_items
  for each row execute function public.ensure_topic_active();

-- TODO(SETUP): sumar al test por rol: planificar un tema inactivo falla con P0001; capacitador no puede
--   insert/delete en training_plans ni training_plan_items.
