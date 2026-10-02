-- 0009_storage_buckets.sql
-- Módulos: M7 · Certificados, M9 · Reporte mensual
-- ESTRUCTURA COMENTADA: lo ejecutable lo escribe quien tome el Setup (TODO(SETUP)).

-- ============================================================
-- Bucket: certificates   (PRIVADO)
-- ============================================================
-- Ruta sugerida: certificates/{person_id}/{training_id}/v{version}.pdf
-- REGLA DE NEGOCIO: nunca se sobrescribe un archivo existente (cada versión tiene su ruta). Sin policy de update/delete.
-- Lectura : Gerente y Capacitador por policy; el Operario por URL firmada corta emitida por certificates-by-dni.
-- Escritura: solo service role (Edge Function generate-certificates).

-- ============================================================
-- Bucket: reports   (PRIVADO)
-- ============================================================
-- Ruta sugerida: reports/{year}/{month}/v{version}.{pdf|xlsx}
-- REGLA DE NEGOCIO: histórico inmutable de lo entregado a YPF.
-- Lectura : Gerente y Capacitador.
-- Escritura: solo service role (Edge Function monthly-report).

-- TODO(SETUP): insert into storage.buckets (id, name, public) values ('certificates', 'certificates', false), ('reports', 'reports', false);
-- TODO(SETUP): policies sobre storage.objects según lo anterior.
-- TODO(M7): definir tamaño máximo y content-type permitido (application/pdf).
