-- 0001_enums_y_extensiones.sql
-- Módulo: Setup · Base de datos
-- ESTRUCTURA COMENTADA: lo ejecutable lo escribe quien tome el Setup (TODO(SETUP)).

-- ============================================================
-- Extensiones
-- ============================================================
-- TODO(SETUP): evaluar si hace falta alguna (ej. pgcrypto / uuid-ossp). En Supabase gen_random_uuid() ya viene.

-- ============================================================
-- Enums
-- ============================================================
-- user_role            : 'gerente' | 'capacitador'              (el Operario NO tiene usuario)
-- topic_type           : 'obligatorio' | 'electivo'              (spec §4)
-- attendance_result    : 'aprobado' | 'no_aprobado'              (spec §6)
-- training_status      : 'abierta' | 'cerrada' | 'anulada'       (spec §6: "cerrar" y "anulada")
--                        TODO(consultar a Santi): la spec no define el ciclo de vida exacto; "abierta" es una suposición.
-- applicability        : 'obligatorio' | 'electivo' | 'no_corresponde'   (spec §6, flag por asistente)

-- create type user_role as enum ('gerente', 'capacitador');
-- create type topic_type as enum ('obligatorio', 'electivo');
-- create type attendance_result as enum ('aprobado', 'no_aprobado');
-- create type training_status as enum ('abierta', 'cerrada', 'anulada');
-- create type applicability as enum ('obligatorio', 'electivo', 'no_corresponde');

-- Convención: nombres de tablas y columnas en inglés snake_case (siguen las rutas de la API de la spec);
-- los valores de enums y los comentarios en español.
