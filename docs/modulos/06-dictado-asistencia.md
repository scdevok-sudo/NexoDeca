# M6 · Dictado y Asistencia

- **Horas estimadas:** 12 h
- **Perfil sugerido:** Frontend (formularios complejos) + Backend (reglas de negocio cruzadas)
- **Responsable:** _sin asignar_
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección 6

## Dependencias

- Depende de: M2, M3, M4 (y M5 como referencia)
- Dependen de este: M7, M8, M9

## Alcance

- CRUD de capacitaciones dictadas: tema, fecha, capacitador responsable, duración real, temario, número de registro correlativo (spec §6).
- Por persona: resultado (Aprobado | No aprobado) y el puesto que tenía AL MOMENTO del curso.
- Carga de asistencia eligiendo del listado de Personal, filtrable por puesto.
- El sistema marca por persona si el tema le correspondía como obligatorio, electivo o no le correspondía (alerta, no bloqueo).
- Consulta de capacitaciones actuales e históricas, filtrando por tema, fecha y capacitador.
- Número de registro correlativo que no se reutiliza jamás.
- Nunca DELETE físico: se anula con estado; con certificado generado no se puede anular ni editar.
- Es el módulo más grande y central: pedir reporte de avance a mitad de camino.

## Archivos de este módulo

- Frontend: `src/modules/trainings/` (`README.md`, `index.ts`, `types.ts`, `schemas.ts`, `api.ts`, `hooks.ts`, `components/`, `pages/`)
  - Páginas: `pages/TrainingsListPage.tsx`, `pages/TrainingFormPage.tsx`, `pages/TrainingDetailPage.tsx`
  - Componentes: `components/TrainingsTable.tsx`, `components/TrainingFilters.tsx`, `components/TrainingForm.tsx`, `components/AttendeePicker.tsx`, `components/ApplicabilityBadge.tsx`, `components/VoidTrainingModal.tsx`
- Migración: `supabase/migrations/0005_capacitaciones_y_asistencia.sql`
- Migración: `supabase/migrations/0008_rls_policies.sql`

## Endpoints que implementa

- `GET /trainings`
- `POST /trainings`
- `PUT /trainings/{id}`
- `POST /trainings/{id}/void`

## Permisos

Capacitador: carga y edita sus propias capacitaciones mientras no tengan certificado. Gerente: ve todas, puede anular, no necesita cargarlas.

## Checklist (orden sugerido)

- [ ] Migración 0005: trainings (con secuencia de nro de registro y estado), training_attendees (con puesto histórico y flag de aplicabilidad).
- [ ] Número de registro correlativo no reutilizable (secuencia/trigger; no usar MAX()+1).
- [ ] api.ts: listTrainings con filtros (tema, fecha, capacitador) y visibilidad por rol.
- [ ] createTraining: asignación del nro de registro y del flag obligatorio/electivo/no corresponde por persona.
- [ ] Guardar el puesto de la persona en la asistencia (copia, no referencia viva).
- [ ] Rechazar personas inactivas en capacitaciones nuevas.
- [ ] Formulario con AttendeePicker (búsqueda + filtro por puesto) y alerta visual de "no le correspondía".
- [ ] updateTraining: solo las propias y sin certificados (409 si ya tiene).
- [ ] voidTraining: Capacitador (la propia) o Gerente; 409 con certificados.
- [ ] Definir el "cierre" de la capacitación (dispara M7). TODO(consultar a Santi).
- [ ] Probar permisos y los tres breakpoints.

## Criterios de "listo"

- [ ] Validaciones en cliente **y** servidor.
- [ ] Permisos probados por rol (y verificados en RLS / Edge Function, no solo ocultando botones).
- [ ] Responsive en los 3 breakpoints (<767px, 768–1024px, >1025px).
- [ ] `npm run build` y `npx tsc --noEmit` limpios.
- [ ] Sin `TODO(M6)` pendientes (`grep -r "TODO(M6)" src supabase`).

## Fuera de alcance de este módulo

- Generación del PDF (M7).
- Firma digital de asistentes (Fase 2).
- Notificaciones por email.
