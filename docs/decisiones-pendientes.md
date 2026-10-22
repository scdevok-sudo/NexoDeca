# Decisiones pendientes y ambigüedades de la spec

Todo lo de acá figura también en el código como `TODO(consultar a Santi)` o en la ficha del módulo. Cuando se resuelva algo, anotá la decisión y la fecha.

## Decisiones abiertas de la spec

| # | Decisión | Quién | Impacto | Estado |
|---|---|---|---|---|
| 1 | **Acceso del Operario.** Camino 1: login por rol + consulta pública por DNI (sin cuenta individual). Camino 2: adelantar login individual. **El esqueleto asume el camino 1.** | Santi | M1 y M8 (y M7 por la vista pública) | Pendiente de confirmar |
| 2 | **Las 80 horas estimadas.** ¿Se aceptan o se recorta alcance? Candidatos si hay que recortar: M8 (vencimientos) o M9 (reporte). | Santi | Todo el reparto | Pendiente de confirmar |
| 3 | **Librería de PDF para certificados (M7):** `pdf-lib` en la Edge Function vs. servicio HTML→PDF. No hay ninguna instalada. | Quien tome M7 | M7, y M9 si el reporte sale en PDF | **Resuelta:** `pdf-lib` (docs/decisiones-tecnicas.md), implementado en M7 |
| 4 | **Formato del reporte para YPF (M9):** PDF vs. Excel. Se define con Juan. | Santi + Juan | M9 | **Excel** (`exceljs`, docs/decisiones-tecnicas.md), implementado en M9. Falta que Juan lo confirme |
| 5 | **Visibilidad de `GET /trainings` para el Capacitador:** ¿solo las propias o todas? La spec dice "las propias, salvo que se quiera dar visibilidad total — a confirmar con Santi". | Santi | M6, RLS (0005 y 0008) | **Resuelta en 0014:** el Capacitador ve solo las propias |

## Ambigüedades encontradas al armar el esqueleto

| # | Ambigüedad | Cómo quedó en el esqueleto |
|---|---|---|
| 6 | **Cierre de una capacitación.** §7 dice "al cerrar una capacitación se generan los certificados", pero la API no tiene endpoint de cierre ni define el disparador. | **Decidido (Lucas, 2026-10-17):** botón "Cerrar y generar certificados" en el detalle (Edge Function `generate-certificates` + RPC `finalize_certificates`, 0020). Cerrada = `tiene_certificados`; `training_status` quedó `activa/anulada` (0014). |
| 7 | **Corregir una capacitación ya certificada.** §7 dice "se corrige la capacitación y se regenera el certificado", pero §6 y la API devuelven 409 al editar o anular con certificados. | **Decidido (Lucas, 2026-10-17), por ahora:** editar con certificados sigue en 409; se corrige **anulando** (ahora permitido con certificados: pasan a `anulado`, el PDF se conserva) y registrando una nueva (0020). Regenerar versiones queda para más adelante (`reemplazado` ya existe en 0015). |
| 8 | **Descarga pública de un certificado.** `GET /certificates/{id}/download` es "público por DNI (si corresponde a esa persona)", sin decir cómo se valida sin login. | **Resuelto (M7):** `certificates-by-dni` devuelve URLs firmadas de 10 min solo de los certificados de ese DNI. Uso interno: Edge Function `certificate-download` (Gerente/Capacitador, URL de 2 min). |
| 9 | **404 en la consulta por DNI.** Dice 404 si no hay certificados o no existe el DNI, y a la vez "responder igual en ambos casos". | **Decidido (Lucas, 2026-10-17):** 404 con el mismo mensaje en ambos casos ("No encontramos certificados para ese DNI"). La pantalla muestra un único mensaje genérico. |
| 10 | **Alta de Capacitadores.** §1 pide que el Gerente cree las cuentas, pero la API solo documenta `/auth/*`. | Edge Function `create-trainer-user` y `TrainerUsersPage` (ruta `/trainers`) marcadas como "no está en la spec". |
| 11 | **Referencia cruzada en §5.** El plan dice comparar contra lo dictado en el "módulo 7", pero el dictado es el módulo 6. | Se tomó como M6. |
| 12 | **"Quién debería tomar el tema" (M5).** Se debe calcular, pero no hay endpoint propio. | **Resuelto (M5):** se calcula en el cliente a pedido, un tema por vez (`getExpectedAttendees`). |
| 13 | **"Mes cerrado" del plan.** No se define qué es. | `TODO(consultar a Santi)` en 0004. |
| 14 | **Endpoints no listados.** Hacen falta `GET /trainings/{id}` (editar/ver) y el listado del histórico de reportes (M9). | **Resuelto:** `getTraining` (M6) y `listMonthlyReports` (M9, tabla `monthly_reports` de 0022). |
| 15 | **Capacitaciones anuladas en el reporte (M9)** y **quien nunca tomó un curso (M8).** No se definen. | **Decidido (Lucas, 2026-10-17):** M9 muestra las anuladas marcadas como Anulada, sin nómina. M8 muestra a quien nunca lo aprobó como "Nunca lo hizo". |
| 16 | **Huecos en el nro de registro.** Una secuencia de Postgres puede dejar huecos ante un rollback; la spec pide "sin huecos". | `TODO(consultar a Santi)` en 0005. |
| 17 | **Ubicación de la spec.** El documento de contexto la cita como `claude/especificacion-...md`; en el repo vive en `docs/`. | Se usa `docs/`. |
