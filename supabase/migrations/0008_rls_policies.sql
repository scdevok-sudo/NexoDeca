-- 0008_rls_policies.sql
-- Módulo: Setup (consolida los permisos de todos los módulos)
-- ESTRUCTURA COMENTADA: lo ejecutable lo escribe quien tome el Setup (TODO(SETUP)).
--
-- REGLA GENERAL: activar RLS en TODAS las tablas. Los permisos por rol se verifican acá (o en Edge Functions),
-- nunca solo ocultando botones en el frontend.
-- Sugerido: funciones auxiliares  auth_role() -> user_role  y  is_gerente() / is_capacitador().
-- Sin token válido -> 401 antes de evaluar cualquier otra regla (salvo certificates-by-dni).

-- profiles
--   select: propio perfil; Gerente todos.   write: solo service role (Edge Function create-trainer-user).

-- positions
--   select: Gerente, Capacitador.   insert/update: Gerente.   delete: Gerente (la regla de "desactivar" la fuerza FK RESTRICT).

-- personnel
--   select: Gerente, Capacitador.   insert/update/delete: Gerente.
--   (importación masiva: Edge Function import-personnel con verificación de rol Gerente).

-- training_topics / topic_positions
--   select: Gerente, Capacitador.   write: Gerente.

-- training_plans / training_plan_items
--   select: Gerente, Capacitador.   write: Gerente.

-- trainings / training_attendees
--   select: Gerente todas; Capacitador las propias (a confirmar con Santi).
--   insert: Capacitador (trainer_id = auth.uid()).
--   update: Capacitador solo las propias y sin certificados; anulación: Capacitador (la propia) o Gerente.
--   delete: NADIE (nunca DELETE físico).

-- certificates
--   select: Gerente, Capacitador.   insert/update: solo service role.   delete: nadie.
--   Operario: SIN acceso por tabla. Solo certificates-by-dni (DNI exacto, respuesta idéntica si no existe).

-- monthly_reports
--   select/insert: Gerente, Capacitador.   update/delete: nadie.

-- storage.objects (buckets, ver 0009)
--   certificados y reportes privados; lectura vía URL firmada de vida corta o por policy según rol.

-- TODO(SETUP): escribir las policies y un test por rol (SQL o script) que pruebe cada permiso.
