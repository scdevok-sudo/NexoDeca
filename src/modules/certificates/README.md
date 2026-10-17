# M7 · Certificados

- **Horas estimadas:** 9 h
- **Perfil sugerido:** Backend / Edge Functions (generación de PDF)
- **Responsable:** Lucas
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 7

## Dependencias

- Depende de: M2, M6
- Dependen de este: M2 (historial en la ficha de personal)

## Alcance

- Al cerrar una capacitación con aprobados, se genera un PDF por cada aprobado (spec §7).
- Contenido mínimo: nombre y DNI, tema, fecha, nro de registro, capacitador y encabezado Deca/Nexoris.
- Vista pública /consulta: el empleado ingresa su DNI exacto y ve solo sus certificados, con descarga (sin login).
- Gerente y Capacitador ven el historial completo de cualquier empleado desde Personal.
- PDF inmutable y versionado: al regenerar se conserva el viejo (auditoría YPF); nunca se sobrescribe.
- Privacidad: la consulta por DNI nunca lista ni busca por nombre; responde igual si el DNI no existe o no tiene certificados.
- Decisión pendiente documentada: pdf-lib vs. HTML→PDF (ver README del módulo).

## Archivos de este módulo

- Frontend: `src/modules/certificates/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/PublicLookupPage.tsx`
  - Componentes: `components/DniLookupForm.tsx`, `components/CertificateList.tsx`, `components/PersonCertificatesPanel.tsx`
- Edge Function: `supabase/functions/generate-certificates/index.ts`
- Edge Function: `supabase/functions/certificates-by-dni/index.ts`
- Migración: `supabase/migrations/0006_certificados.sql`
- Migración: `supabase/migrations/0009_storage_buckets.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /certificates/by-dni/{dni} (público)`
- `GET /personnel/{id}/certificates`
- `GET /certificates/{id}/download`

## Permisos

Operario: su propio historial por DNI, sin login. Gerente y Capacitador: historial de cualquier empleado.

## Decisión pendiente: librería de PDF

La spec deja abierto si los certificados se generan con **pdf-lib** (corre dentro de la Edge Function, sin dependencias pesadas) o con un servicio de render **HTML→PDF**. No se eligió ninguna librería en el esqueleto. Quien tome este módulo decide, lo documenta acá y en `docs/decisiones-pendientes.md`.

## Checklist (orden sugerido)

- [ ] Decidir y documentar pdf-lib vs. HTML→PDF en este README y en docs/decisiones-pendientes.md.
- [ ] Migración 0006 (certificados versionados) y bucket privado en 0009.
- [ ] Edge Function generate-certificates: un PDF por aprobado, guardado en Storage sin sobrescribir versiones anteriores.
- [ ] Definir cuándo se dispara (cierre de la capacitación; TODO consultar a Santi).
- [ ] Edge Function certificates-by-dni: público, DNI exacto, respuesta idéntica si no existe, sin listados ni búsqueda parcial; considerar rate limiting.
- [ ] Resolver cómo se autoriza la descarga pública (URL firmada de corta vida).
- [ ] GET /personnel/{id}/certificates con RLS para Gerente/Capacitador.
- [ ] Vista pública /consulta fuera del AppShell, responsive.
- [ ] Panel de historial de certificados para la ficha de Personal (M2).
- [ ] Revisión de privacidad con Santi antes de dar por cerrado.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M7)` pendientes (`grep -r "TODO(M7)" src supabase`).

## Fuera de alcance de este módulo

- Firma digital (Fase 2).
- Envío del certificado por email.
- Login de Operarios (camino 2).
