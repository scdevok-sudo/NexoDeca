# QA · Testing, ajustes, deploy y buffer

- **Horas estimadas:** 8 h
- **Perfil sugerido:** Full-stack / QA — integración final
- **Responsable:** Santi (según la spec; confirmar)
- **Fuente:** `docs/especificacion-modulo1-fase1-capacitaciones.md`, sección "División de tareas"

## Checklist

- [ ] TODO(QA): probar cada pantalla con cada rol y sin sesión (Gerente, Capacitador, público).
- [ ] TODO(QA): probar la consulta pública por DNI: DNI inexistente vs. sin certificados (respuesta idéntica), sin listados, sin búsqueda parcial.
- [ ] TODO(QA): revisar responsive en < 767px, 768–1024px y > 1025px en todas las vistas.
- [ ] TODO(QA): probar reglas de negocio: DNI único, desactivar en vez de borrar, nro de registro correlativo sin reutilizar, puesto histórico en la asistencia, PDFs versionados.
- [ ] TODO(QA): `npx tsc --noEmit`, `npm run build` y `npm run lint` limpios; sin `TODO(...)` pendientes.
- [ ] TODO(QA): deploy del frontend en Vercel y de las Edge Functions/migraciones en Supabase; variables de entorno.
- [ ] TODO(QA): confirmar con Juan los puestos de ejemplo antes de producción.
- [ ] TODO(QA): resolver o descartar todo `TODO(consultar a Santi)` (ver `docs/decisiones-pendientes.md`).
