insert into storage.buckets (id, name, public)
values
  ('certificados-pdf', 'certificados-pdf', false),
  ('reportes-mensuales', 'reportes-mensuales', false);

-- A proposito no se crean policies de storage.objects para authenticated
-- ni anon sobre estos dos buckets: al ser privados y sin ninguna policy,
-- nadie accede directo a los objetos salvo la service_role (que siempre
-- bypassa RLS). Toda lectura pasa por una Edge Function que genera una
-- signed URL de corta duracion.
