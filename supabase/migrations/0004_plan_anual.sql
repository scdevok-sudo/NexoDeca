-- 0004_plan_anual.sql
-- Módulo: M5 · Plan Anual de Capacitación
-- ESTRUCTURA COMENTADA: lo ejecutable lo escribe quien tome el Setup (TODO(SETUP)).

-- ============================================================
-- Tabla: training_plans   (uno por año, spec §5)
-- ============================================================
-- year        integer PK                      -- una entrada por año
-- created_at / updated_at timestamptz

-- ============================================================
-- Tabla: training_plan_items   (qué temas se dictan en cada mes)
-- ============================================================
-- id          uuid PK default gen_random_uuid()
-- plan_year   integer not null FK -> training_plans(year) ON DELETE CASCADE
-- month       smallint not null CHECK (month between 1 and 12)
-- topic_id    uuid not null FK -> training_topics(id) ON DELETE RESTRICT
-- Constraints : UNIQUE (plan_year, month, topic_id)
-- Índices     : (plan_year, month)
-- REGLA DE NEGOCIO: el plan es la intención, lo dictado es el hecho. Modificar un mes con capacitaciones
--   ya dictadas NO borra ni altera trainings / training_attendees (no hay FK desde trainings hacia el plan).
-- REGLA DE NEGOCIO: solo temas existentes y activos pueden asignarse (400 si no).
-- TODO(consultar a Santi): qué significa "mes cerrado" (¿mes ya pasado? ¿con capacitaciones dictadas?).
-- TODO(M5): "quién debería tomar cada tema" se calcula (topic_positions x personnel activos); decidir vista SQL vs. cálculo en API.

-- RLS esperada (se detalla en 0008):
--   select: Gerente y Capacitador.
--   insert/update/delete: solo Gerente.
