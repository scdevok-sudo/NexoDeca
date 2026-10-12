# Decisiones técnicas — SGI Deca (Fase 1)

## Generación de PDF

- **Certificados (módulo 7):** `pdf-lib` corriendo en una Edge Function. Layout de una sola página, sin dependencias
  pesadas y sin servicio externo de render.
- **Reporte mensual YPF (módulo 9):** `.xlsx` con `exceljs` en vez de PDF. Es tabular y potencialmente multi-página:
  `pdf-lib` no arma tablas ni paginación solo, y Excel le sirve más a Juan para filtrar antes de entregárselo a YPF.
