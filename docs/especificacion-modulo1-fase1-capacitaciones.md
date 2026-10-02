# Especificación de requerimientos — Módulo 1, Fase 1 (Capacitaciones)

## Sistema de Gestión Integral (SGI) — Cliente: Juan Sequeira (Nexoris) / Deca Electromecánica S.A.

> Documento de trabajo interno de SCdev. Redactado con el formato de
> `SKILL-especificacion-requerimientos.md` para dividir el desarrollo entre el equipo
> (Santi, Agustín, Ezequiel, Lucas). Alcance: **únicamente la Fase 1** del acuerdo firmado
> con Juan Sequeira el 25/09/2026 (Capacitaciones, $450.000 ARS). No incluye nada de la
> Fase 2 (equipos, inspecciones, dashboard con gráficos, login con Google, firma digital).

**Fecha de redacción:** 02/10/2026
**Fuente del alcance:** Acuerdo de Prestación de Servicios firmado, cláusula 2 (Fase 1 ·
Capacitaciones) y `claude/lead-juan-sgi.md`.

---

# Contexto

Juan Sequeira es consultor/auditor líder en Sistemas de Gestión Integral (Calidad,
Seguridad e Higiene, Medio Ambiente) para PyMEs contratistas de YPF en la zona de La
Plata/Ensenada, a través de su consultora Nexoris. Su cliente piloto es **Deca
Electromecánica S.A.**

Hoy, Deca gestiona las capacitaciones de su personal en Google Drive y planillas Excel.
Cada mes, Juan define un tema obligatorio (ej. "10 reglas de oro"), los capacitadores dan
el curso al personal correspondiente y, a mano, arma una planilla con quién lo hizo. A fin
de mes tiene que presentarle a YPF un reporte con la nómina de personal capacitado y el
número de registro de cada capacitación. Este circuito manual tiene problemas conocidos:

- No hay forma simple de saber, en cualquier momento, qué empleados tienen un curso
  obligatorio vencido o por vencer.
- Las capacitaciones no distinguen automáticamente por puesto de trabajo: hoy depende de
  que el capacitador recuerde a quién corresponde cada curso.
- El reporte mensual para YPF se arma a mano, cruzando varias planillas.
- No hay historial centralizado por empleado ni certificado automático: cada constancia se
  genera por separado.

La Fase 1 digitaliza este circuito completo: plan anual de capacitación mensualizado, con
cursos obligatorios y electivos restringidos por puesto, registro de quién dio y quién
tomó cada curso, certificado automático en PDF, notificación de cursos por vencer y el
reporte mensual listo para entregar a YPF.

Queda **fuera de esta fase** (entra en la Fase 2 o en etapas posteriores del roadmap, no
se construye ahora): inspecciones de equipos y vehículos con QR, OPS, dashboard con
gráficos, login con cuenta de Google, firma digital, choferes, consulta de procedimientos,
notificaciones automáticas por correo electrónico, y toda la arquitectura multi-cliente.

---

# Actores/roles

El sistema ya tiene tres roles definidos en la demo original, que se mantienen para esta
fase:

- **Gerente**: responsable del SGI del lado de Deca (o Juan, operando como su consultor).
  Arma el plan anual, administra el catálogo de temas y puestos, y consulta cumplimiento y
  reportes.
- **Capacitador**: dicta los cursos. Registra la asistencia y el resultado de cada curso
  dictado, y genera los certificados.
- **Operario**: el empleado de Deca. Consulta sus propias capacitaciones pendientes y
  completadas, y descarga su certificado. **Ver la nota sobre autenticación más abajo —
  es una decisión pendiente, no algo ya resuelto.**

⚠️ **Nota importante sobre el rol Operario y el login (decisión pendiente):**
El acuerdo firmado ubica el login con cuenta de Google explícitamente en la **Fase 2**
("Autenticación con Google: acceso individual por persona"). Pero varios requerimientos de
esta Fase 1 (notificar al empleado que tiene un curso pendiente, que el Operario vea sus
propias capacitaciones) dan por sentado que cada empleado tiene alguna forma de
identificarse en el sistema. Hay dos caminos:

1. **Mantener el login genérico por rol** (como en la demo actual) y resolver "la consulta
   del Operario" como una pantalla tipo kiosco donde cualquiera busca por DNI, sin cuenta
   individual — igual al patrón de "Sector Comedor" de sistemas de turnos/pedidos. Las
   notificaciones de vencimiento, en este caso, las ve el Capacitador/Gerente en su panel
   (no llegan directo al empleado), y se las comunican por fuera del sistema (como ya se
   hace hoy, por ejemplo, por WhatsApp).
2. **Adelantar el login individual** (aunque sea sin Google, con un código simple) para que
   cada Operario tenga su propia sesión y reciba la notificación dentro del sistema.

Este documento especifica el **camino 1** (login por rol + consulta del Operario por DNI,
sin cuenta individual), porque es consistente con lo que efectivamente se cotizó y firmó
para esta fase. Si Santi prefiere el camino 2, hay que ajustar el módulo de Login y el de
Notificaciones antes de repartir tareas — **confirmar esto antes de arrancar**, no es un
detalle menor.

---

# Componentes de la aplicación

- **Frontend**: React + Vite + Tailwind (ya existe como demo funcional; se reconstruye
  sobre datos reales en vez de los datos mockeados en memoria/localStorage de la demo).
- **Backend / base de datos**: Supabase (PostgreSQL + Auth + Storage), tal como está
  definido en la Cláusula 5 del acuerdo firmado.
- **Lógica de negocio**: donde alcance con políticas de Row Level Security (RLS) de
  Supabase, se resuelve ahí. Para lo que necesita lógica más compleja (generación de
  certificados en PDF, cálculo de vencimientos, armado del reporte mensual), se usan
  Edge Functions de Supabase (Deno) en vez de meter esa lógica en el frontend.
- **Generación de PDF**: a definir entre `pdf-lib` (corre en la Edge Function, sin
  dependencias pesadas) o un servicio de render HTML→PDF. Queda para quien tome el módulo
  de Certificados decidirlo y dejarlo documentado.
- **Hosting**: Vercel (frontend), Supabase (backend), tal como está en el acuerdo.
- **Autenticación**: login por rol (Gerente, Capacitador) con usuario/contraseña vía
  Supabase Auth. El Operario no tiene cuenta en esta fase (ver nota de arriba).

---

## 1. Login y manejo de sesiones

### Descripción

Implementa el acceso a la aplicación para los roles Gerente y Capacitador. El Operario no
inicia sesión en esta fase: accede a una vista de consulta pública restringida (ver Notas),
sin necesidad de credenciales.

### Requerimientos funcionales

- Formulario de login con email y contraseña, usando Supabase Auth.
- Cada usuario tiene asignado un único rol: Gerente o Capacitador.
- Verificación de sesión y de rol en cada pantalla protegida.
- Cierre de sesión.
- El Gerente puede crear cuentas para los Capacitadores (no hace falta un flujo de
  auto-registro).

### Notas

- Dado que es un solo cliente (Deca) en esta fase, no hace falta un módulo de gestión de
  múltiples empresas ni de sectores/sucursales — eso es parte de la arquitectura
  multi-cliente, fuera de esta fase.
- La vista de consulta del Operario (ver módulo de Certificados) **no requiere login**,
  pero sí requiere el DNI del empleado para mostrar únicamente su información — nunca un
  listado completo del personal.
- Usar Supabase Auth en vez de implementar hash de contraseñas a mano (a diferencia del
  trabajo integrador de la facultad, acá no hay restricción de "no usar librerías de
  login" — tiene sentido apoyarse en Supabase).

### Permisos

- Gerente y Capacitador pueden iniciar sesión. El Operario no tiene usuario en esta fase.

---

## 2. Gestión de Personal

### Descripción

Registra a los empleados de Deca que pueden ser incluidos en capacitaciones. Es la base
para todo lo demás: sin esto no hay a quién asignarle un curso ni a quién generarle un
certificado.

### Requerimientos funcionales

- Operaciones CRUD de personal.
- Campos mínimos por persona:
  - DNI.
  - Nombre y apellido.
  - Puesto (ver módulo 3).
  - Fecha de ingreso.
  - Activo: Sí | No.
  - Fecha de creación y de última modificación.
- Validar que no existan dos personas con el mismo DNI.
- Permitir importación masiva de personal mediante un archivo CSV (Deca va a tener
  personal cargado desde el día uno, no tiene sentido cargarlo uno por uno).
- Funcionalidad de búsqueda por DNI, nombre/apellido, puesto y estado.
- Resultados ordenables por apellido y nombre, y por fecha de ingreso.
- Paginación del lado del servidor, 25 registros por página.

### Notas

- Validar en cliente y servidor: campos requeridos, formato de DNI, unicidad de DNI,
  existencia del puesto seleccionado.
- No se puede eliminar una persona que ya tiene capacitaciones o certificados asociados:
  se desactiva en vez de borrarse.
- Una persona inactiva no se puede incorporar a nuevas capacitaciones, pero su historial
  sigue visible.
- Un cambio de puesto de una persona (ascenso, cambio de tarea) **no debe modificar
  retroactivamente** las capacitaciones ya dictadas ni sus certificados — el puesto que
  importa en un registro histórico es el que tenía la persona al momento del curso, no el
  actual. Guardar el puesto como dato del registro de asistencia, no solo como referencia
  viva a la ficha de la persona.
- La importación masiva debe informar registros procesados, importados y rechazados, con
  el motivo de cada rechazo.

### Permisos

- Gerente: acceso completo (crear, editar, desactivar, importar).
- Capacitador: solo lectura (para buscar a quién le va a tomar asistencia).

---

## 3. Puestos y Tipos de Personal

### Descripción

Catálogo de los puestos de trabajo de Deca (ej. Oficial, Medio Oficial, Ayudante,
Supervisor). Es el dato que permite restringir qué capacitaciones corresponden a cada
persona, tal como lo pidió Juan en la llamada del 25/09 ("si sos oficial te mando la de
ejecutante y la de uso amoladora, si sos ayudante no puedes ser ninguna de las dos").

### Requerimientos funcionales

- Operaciones CRUD de puestos.
- Campos mínimos: nombre del puesto, descripción, activo (Sí/No).
- Validar que no existan dos puestos con el mismo nombre.
- Precargar los puestos que Juan ya mencionó (Oficial, Medio Oficial, Ayudante,
  Supervisor) como datos de ejemplo, a confirmar con Juan antes de ir a producción.

### Notas

- No se puede eliminar un puesto que tenga personal o temas de capacitación asociados: se
  desactiva.
- Un puesto inactivo no puede asignarse a personal nuevo ni a nuevos temas, pero sigue
  visible en los registros históricos.

### Permisos

- Solamente el Gerente administra este catálogo. El Capacitador solo lo puede consultar
  (para entender a quién le corresponde cada curso).

---

## 4. Catálogo de Capacitaciones (Temas)

### Descripción

Define cada tema de capacitación disponible: si es obligatorio o electivo, a qué puestos
corresponde, y cada cuánto vence (para que el sistema sepa cuándo generar una notificación
de curso por vencer).

### Requerimientos funcionales

- Operaciones CRUD de temas de capacitación.
- Campos mínimos por tema:
  - Nombre del tema.
  - Tipo: Obligatorio | Electivo.
  - Puestos a los que aplica (uno o varios — ej. un tema puede aplicar a Oficial y
    Supervisor pero no a Ayudante).
  - Periodicidad de vencimiento en meses (ej. 12 = se vuelve a dictar cada año; puede
    quedar vacío si el tema no vence, como una inducción única).
  - Duración estimada del curso (horas).
  - Activo: Sí | No.
- Validar que no existan dos temas con el mismo nombre.
- Funcionalidad de búsqueda por nombre, tipo y puesto.
- Paginación del lado del servidor, 25 registros por página.

### Notas

- Un tema inactivo no puede incorporarse a un plan nuevo, pero las capacitaciones ya
  dictadas con ese tema mantienen su historial sin cambios.
- Cambiar los puestos asociados a un tema no debe afectar capacitaciones ya dictadas.

### Permisos

- Solamente el Gerente administra el catálogo de temas. El Capacitador solo lo consulta.

---

## 5. Plan Anual de Capacitación

### Descripción

El Gerente arma, mes a mes, qué temas se van a dictar durante el año (tal como hoy Juan
define "este mes toca 10 reglas de oro y permiso de trabajo"). El plan es la referencia
contra la que se mide el cumplimiento mensual.

### Requerimientos funcionales

- Operaciones CRUD del plan: una entrada por año.
- Por cada mes del plan, el Gerente asigna uno o más temas de capacitación (del catálogo
  del módulo 4).
- El sistema debe calcular, para cada tema planificado en un mes, qué personas deberían
  tomarlo (según su puesto), para poder comparar después contra quién efectivamente lo
  tomó (módulo 7).
- Permitir copiar el plan de un año a otro como punto de partida (los temas suelen
  repetirse de un año a otro, según lo que contó Juan).
- Consultar el plan actual e históricos de años anteriores.

### Notas

- Modificar el plan de un mes ya cerrado (con capacitaciones ya dictadas) no debe borrar
  ni alterar lo ya dictado — el plan es la intención, lo dictado es el hecho.
- El plan no reemplaza al catálogo de temas: solo define cuándo se dicta cada uno.

### Permisos

- Solamente el Gerente arma y modifica el plan. El Capacitador lo consulta para saber qué
  le toca dictar cada mes.

---

## 6. Dictado de Capacitaciones y Registro de Asistencia

### Descripción

Es el corazón del sistema: cuando el Capacitador efectivamente dicta un curso, carga acá
quién participó y el resultado. Esto es lo que alimenta el certificado, el historial por
empleado y el reporte mensual.

### Requerimientos funcionales

- Operaciones CRUD de capacitaciones dictadas.
- Campos mínimos de una capacitación dictada:
  - Tema (del catálogo, módulo 4).
  - Fecha de dictado.
  - Capacitador responsable.
  - Duración real.
  - Temario desarrollado (texto libre breve).
  - Número de registro (correlativo automático, para el reporte a YPF).
- Por cada persona que participó: resultado (Aprobado | No aprobado), y el puesto que
  tenía al momento del curso (ver nota del módulo 2).
- El Capacitador puede cargar la asistencia seleccionando personas del listado de
  Personal, filtrado opcionalmente por puesto.
- El sistema debe marcar automáticamente, para cada persona cargada, si ese tema le
  correspondía como obligatorio, electivo, o no le correspondía (esto último como alerta,
  no como bloqueo — un capacitador puede querer anotar igual la participación).
- Consultar capacitaciones dictadas, actuales e históricas, filtrando por tema, fecha,
  capacitador.

### Notas

- El número de registro es correlativo y nunca se reutiliza, aunque se borre una
  capacitación cargada por error (se marca como anulada, no se elimina físicamente, para
  no generar huecos ni duplicados en la numeración que después aparecen en los
  certificados).
- No se puede eliminar una capacitación que ya tenga un certificado generado: se anula
  mediante un estado, nunca un DELETE físico.
- Este módulo es, en términos de horas, el más grande de la fase — conviene que lo tome
  quien tenga más continuidad semana a semana (ver sección de división de tareas).

### Permisos

- El Capacitador carga y edita sus propias capacitaciones mientras no tengan certificado
  generado.
- El Gerente puede ver todas las capacitaciones de todos los capacitadores, pero no
  necesita cargarlas él mismo (salvo que sea también capacitador).

---

## 7. Certificados

### Descripción

Genera automáticamente el certificado en PDF de cada persona que aprobó una capacitación,
y mantiene el historial de certificados por empleado. Es la vista que el Operario consulta
sin necesidad de login.

### Requerimientos funcionales

- Al cerrar una capacitación dictada (módulo 6) con participantes aprobados, el sistema
  genera automáticamente un certificado en PDF por cada uno.
- El certificado incluye como mínimo: nombre y DNI del empleado, tema, fecha, número de
  registro, capacitador, y el encabezado corporativo de Deca/Nexoris (nombre, logo si
  corresponde).
- Vista de consulta por DNI (sin login, ver nota del módulo 1): el empleado ingresa su DNI
  y ve su propio historial de certificados, con opción de descargar cada uno en PDF.
- El Gerente y el Capacitador pueden ver y descargar el historial completo de certificados
  de cualquier empleado desde el módulo de Personal.

### Notas

- El PDF generado es inmutable: si se detecta un error en los datos de una capacitación ya
  certificada, se corrige la capacitación y se regenera un certificado nuevo que
  reemplaza al anterior en la vista, pero conviene conservar el PDF viejo como histórico
  (nunca sobrescribir el archivo sin dejar rastro, por las dudas de una auditoría de YPF).
- La vista de consulta por DNI debe devolver **solamente** los datos de esa persona — es
  el punto más sensible en términos de privacidad de todo este módulo: nunca debe permitir
  buscar o listar a otras personas.

### Permisos

- Operario: consulta su propio historial por DNI, sin login.
- Capacitador y Gerente: consultan el historial de cualquier empleado desde el sistema.

---

## 8. Seguimiento de Vencimientos y Notificaciones

### Descripción

Calcula qué capacitaciones están por vencer (según la periodicidad definida en el
catálogo de temas) y avisa antes de que termine el mes, tal como Juan lo pidió explícitamente
en la llamada del 25/09.

### Requerimientos funcionales

- El sistema calcula, para cada persona y cada tema obligatorio que le corresponde según
  su puesto, la fecha del último curso aprobado y la fecha en que vuelve a vencer (según la
  periodicidad del tema).
- Panel de vencimientos para el Gerente y el Capacitador: lista de personas con
  capacitaciones vencidas o próximas a vencer (ej. dentro de los próximos 15 días),
  agrupadas por tema.
- El panel debe poder filtrarse por puesto y por tema.

### Notas

- **Esto NO incluye notificaciones automáticas por correo electrónico** — eso está
  explícitamente fuera de presupuesto según lo acordado el 25/09. La notificación es un
  panel que el Gerente/Capacitador consulta dentro del sistema; avisarle al empleado sigue
  siendo un paso manual (como hoy, por ejemplo por WhatsApp), al menos hasta que se cotice
  la integración de notificaciones automáticas.
- Si en el futuro se resuelve dar a cada Operario su propia cuenta (ver nota del módulo 1),
  este panel es la base para mostrarle a cada empleado sus propios vencimientos sin
  depender de que el Gerente se lo informe.

### Permisos

- Gerente y Capacitador acceden al panel completo. No hay vista de este módulo para el
  Operario en esta fase.

---

## 9. Reporte Mensual para YPF

### Descripción

Genera el reporte descargable que Juan necesita presentar cada mes: nómina completa del
personal capacitado, por tema, con el número de registro de cada capacitación. Reemplaza
el cruce manual de planillas que hace hoy.

### Requerimientos funcionales

- El Gerente (o Capacitador) selecciona un mes y año, y el sistema genera un reporte
  descargable (PDF o Excel, a definir con Juan cuál prefiere entregarle a YPF) con:
  - Por cada capacitación dictada ese mes: tema, fecha, número de registro, capacitador.
  - Nómina completa de personas que participaron, con su resultado.
- Permitir descargar reportes de meses anteriores, no solo el actual.

### Notas

- El reporte debe poder generarse aunque falten capacitaciones por dictar ese mes — Juan
  necesita poder verificar el estado antes de que cierre el mes, no solo después.
- Igual que el certificado, conviene que el reporte generado quede guardado como archivo
  histórico (no solo regenerado al vuelo cada vez), para que lo que Juan le entregó a YPF
  en su momento se pueda reconstruir exactamente igual más adelante si hace falta.

### Permisos

- Gerente y Capacitador pueden generar y descargar el reporte. El Operario no tiene acceso
  a este módulo.

---

# API

Notas generales (aplican a todos los endpoints, repetidas de
`plantilla-endpoint-api.md`):

- Todos los endpoints manejan errores con el código HTTP correspondiente (400/401/403/404/409)
  y el detalle en el cuerpo de la respuesta.
- Salvo el login y la consulta pública de certificados por DNI, todo endpoint requiere
  autenticación: sin token válido, se rechaza con 401 antes de evaluar cualquier otra regla.
- Los permisos por rol se verifican en el propio endpoint (o en la política RLS de
  Supabase), nunca solo ocultando el botón en el frontend.

### Autenticación

- `POST /auth/login` — iniciar sesión (Gerente, Capacitador).
- `POST /auth/logout` — cerrar sesión.
- `GET /auth/me` — datos del usuario autenticado (nombre, rol).

### Personal

- `GET /personnel` — listar/buscar personal.
  - **Rol(es)**: Gerente, Capacitador (solo lectura para Capacitador).
  - **Entrada**: filtros por DNI, nombre/apellido, puesto, estado; paginación.
  - **Salida**: listado paginado.
  - **Reglas de negocio**: por defecto, solo personas activas.
  - **Errores**: 400 si los filtros son inválidos.
- `POST /personnel` — crear una persona.
  - **Rol(es)**: Gerente.
  - **Entrada**: DNI, nombre, apellido, puesto, fecha de ingreso.
  - **Reglas de negocio**: DNI único; el puesto debe existir y estar activo.
  - **Errores**: 400 datos inválidos; 409 DNI duplicado.
- `PUT /personnel/{id}` — modificar una persona.
  - **Rol(es)**: Gerente.
  - **Reglas de negocio**: no permitir generar un DNI duplicado; el cambio de puesto no
    afecta registros históricos de capacitaciones ya dictadas.
  - **Errores**: 404; 400; 409 si el DNI corresponde a otra persona.
- `DELETE /personnel/{id}` — desactivar una persona.
  - **Rol(es)**: Gerente.
  - **Reglas de negocio**: si tiene capacitaciones o certificados asociados, se desactiva
    en vez de eliminarse físicamente.
  - **Errores**: 404.
- `POST /personnel/import` — importación masiva por CSV.
  - **Rol(es)**: Gerente.
  - **Entrada**: archivo CSV.
  - **Salida**: cantidad procesada, importada y rechazada, con motivo de cada rechazo.
  - **Errores**: 400 si el archivo no respeta el formato esperado.

### Puestos

- `GET /positions` — listar puestos.
  - **Rol(es)**: Gerente, Capacitador.
- `POST /positions` / `PUT /positions/{id}` / `DELETE /positions/{id}` — CRUD de puestos.
  - **Rol(es)**: Gerente.
  - **Reglas de negocio**: nombre único; no se elimina un puesto con personal o temas
    asociados, se desactiva.
  - **Errores**: 400; 409 nombre duplicado; 409 si tiene asociaciones activas y se intenta
    eliminar en vez de desactivar.

### Temas de Capacitación

- `GET /training-topics` — listar/buscar temas.
  - **Rol(es)**: Gerente, Capacitador.
  - **Entrada**: filtros por nombre, tipo, puesto.
- `POST /training-topics` / `PUT /training-topics/{id}` / `DELETE /training-topics/{id}`
  — CRUD de temas.
  - **Rol(es)**: Gerente.
  - **Reglas de negocio**: nombre único; al desactivar, no afecta capacitaciones ya
    dictadas con ese tema.
  - **Errores**: 400; 409 nombre duplicado.

### Plan Anual de Capacitación

- `GET /training-plans/{year}` — obtener el plan de un año.
  - **Rol(es)**: Gerente, Capacitador.
- `PUT /training-plans/{year}` — crear o modificar el plan de un año (asignación de temas
  por mes).
  - **Rol(es)**: Gerente.
  - **Reglas de negocio**: modificar un mes ya con capacitaciones dictadas no altera lo ya
    dictado.
  - **Errores**: 400 si algún tema no existe o está inactivo.
- `POST /training-plans/{year}/copy-from/{source_year}` — copiar el plan de otro año.
  - **Rol(es)**: Gerente.
  - **Errores**: 404 si el año de origen no tiene plan.

### Capacitaciones (dictado y asistencia)

- `GET /trainings` — listar capacitaciones dictadas.
  - **Rol(es)**: Gerente (todas), Capacitador (las propias, salvo que se quiera dar
    visibilidad total — a confirmar con Santi).
  - **Entrada**: filtros por tema, fecha, capacitador; paginación.
- `POST /trainings` — registrar una capacitación dictada, con su lista de asistentes y
  resultados.
  - **Rol(es)**: Capacitador.
  - **Entrada**: tema, fecha, duración, temario desarrollado, lista de personas con
    resultado (Aprobado/No aprobado).
  - **Salida**: la capacitación creada, con su número de registro asignado.
  - **Reglas de negocio**: número de registro correlativo automático, nunca se reutiliza;
    marca automáticamente si el tema correspondía a cada persona según su puesto.
  - **Errores**: 400 si falta el tema o la fecha es inválida.
- `PUT /trainings/{id}` — modificar una capacitación.
  - **Rol(es)**: Capacitador (solo las propias, y solo si no tiene certificados generados).
  - **Errores**: 404; 409 si ya tiene certificados generados.
- `POST /trainings/{id}/void` — anular una capacitación cargada por error.
  - **Rol(es)**: Capacitador (la propia) o Gerente.
  - **Reglas de negocio**: nunca se borra físicamente; el número de registro queda
    marcado como anulado y no se reutiliza.
  - **Errores**: 404; 409 si ya tiene certificados generados (en ese caso, corregir
    generando una capacitación nueva en vez de anular la vieja).

### Certificados

- `GET /certificates/by-dni/{dni}` — consulta pública (sin login) de certificados de una
  persona.
  - **Rol(es)**: público (sin autenticación), pero con el único dato de entrada siendo el
    DNI exacto — nunca devuelve listados ni permite búsqueda parcial por nombre.
  - **Salida**: listado de certificados de esa persona, con link de descarga del PDF.
  - **Errores**: 404 si el DNI no tiene certificados o no existe en el sistema (responder
    igual en ambos casos, para no confirmar o negar la existencia de una persona).
- `GET /personnel/{id}/certificates` — historial de certificados de una persona
  (vista interna).
  - **Rol(es)**: Gerente, Capacitador.
- `GET /certificates/{id}/download` — descargar el PDF de un certificado puntual.
  - **Rol(es)**: público por DNI (si corresponde a esa persona) o Gerente/Capacitador.

### Vencimientos

- `GET /compliance/upcoming` — listar personas con capacitaciones vencidas o próximas a
  vencer.
  - **Rol(es)**: Gerente, Capacitador.
  - **Entrada**: filtros por puesto, tema, rango de días (default 15).
  - **Reglas de negocio**: calculado a partir de la fecha del último curso aprobado de
    cada persona por tema, más la periodicidad de vencimiento del tema.

### Reportes

- `GET /reports/monthly/{year}/{month}` — generar/descargar el reporte mensual para YPF.
  - **Rol(es)**: Gerente, Capacitador.
  - **Salida**: archivo (PDF o Excel) con capacitaciones del mes y nómina de participantes.
  - **Reglas de negocio**: puede generarse con el mes en curso todavía incompleto; el
    reporte generado queda guardado como archivo histórico.

---

# Requisitos técnicos y pautas de trabajo

- Stack: React + Vite + Tailwind (frontend), Supabase — PostgreSQL + Auth + Storage +
  Edge Functions (backend), Vercel (hosting del frontend).
- Validar todos los datos de entrada tanto en el cliente como en el servidor (o en la
  política RLS/Edge Function correspondiente, cuando no haya un backend propio
  intermedio).
- Contraseñas gestionadas por Supabase Auth, nunca a mano.
- Toda interacción con la base de datos a través del cliente de Supabase (evita
  inyección SQL al no armar queries a mano).
- Versionar con git, commits atómicos (`tsc --noEmit` / `npm run build` antes de cada
  commit grande, según la preferencia habitual de Santi).
- Todas las vistas responsive, probadas como mínimo en < 767px, 768–1024px y > 1025px
  (la demo ya pasó esta auditoría una vez — mantenerla al reconstruir sobre datos reales).
- Manejo de logs básico en las Edge Functions para poder depurar sin acceso directo a
  producción.
- Lo que no entra en esta fase (no empezar a construirlo todavía, aunque el modelo de
  datos de referencia lo contemple a futuro): inspecciones de equipos/vehículos,
  choferes, OPS, dashboard con gráficos, login con Google, firma digital, notificaciones
  automáticas por correo electrónico, arquitectura multi-cliente.

---

# División de tareas entre el equipo

Esta tabla no asigna módulos a personas puntuales: para cada módulo se indica la
**habilidad o perfil requerido**, para que cada uno elija qué módulo tomar según lo que
maneja mejor y tenga disponible esa semana (en vez de que Santi asigne a dedo). Como
criterio general para elegir: los módulos más chicos y autocontenidos (1, 3, 4, 8, 9) son
buenos para quien tiene menos continuidad semana a semana; el módulo 6 es el más grande y
el más central — conviene que lo tome quien pueda garantizar continuidad, porque es el que
más atrasa al resto si se traba. Santi arranca el setup inicial (define la base para todo
lo demás) y cierra con testing/deploy antes de la entrega.

| Módulo | Horas estimadas | Habilidad / perfil requerido | Por qué |
|---|---:|---|---|
| Setup Supabase (schema, RLS, Auth) | 8 h | Backend — diseño de base de datos y Supabase (RLS, Auth) | Define la base de la que dependen todos los demás módulos; conviene arrancarlo con visión completa del sistema. |
| 1. Login y sesiones | 6 h | Frontend + Auth (Supabase Auth) | Acotado y bien definido, no depende de que otros módulos estén listos. |
| 2. Gestión de Personal | 8 h | Frontend + Backend (CRUD, validaciones, import CSV) | Módulo base, con continuidad hacia los módulos 6 y 7. |
| 3. Puestos y Tipos de Personal | 4 h | Frontend + Backend (CRUD simple) | Chico, pero acoplado al módulo de Personal — conviene que lo tome quien haga ese módulo. |
| 4. Catálogo de Capacitaciones (Temas) | 5 h | Frontend + Backend (CRUD) | Autocontenido, se puede tomar en un pico de disponibilidad. |
| 5. Plan Anual de Capacitación | 9 h | Frontend (UI de planificación mensual) + Backend | Depende de Personal/Puestos/Temas; mejor con continuidad semanal. |
| 6. Dictado y Asistencia | 12 h | Frontend (formularios complejos) + Backend (reglas de negocio cruzadas) | El módulo más grande y más central de la fase — necesita continuidad semana a semana. |
| 7. Certificados (PDF) | 9 h | Backend / Edge Functions (generación de PDF) | Lógica sensible a privacidad (consulta pública por DNI) — requiere cuidado extra en permisos. |
| 8. Vencimientos y notificaciones | 5 h | Backend (cálculo de fechas) + Frontend (panel y filtros) | Autocontenido una vez que existen Personal, Puestos, Temas y Dictado. |
| 9. Reporte mensual YPF | 6 h | Backend (agregación de datos y export a PDF/Excel) | Acotado: toma datos ya existentes y los exporta, sin lógica nueva compleja. |
| Testing, ajustes, deploy, buffer | 8 h | Full-stack / QA — integración final | Requiere visión de todo el sistema ya armado y responsabilidad ante el cliente. |
| **Total** | **80 h** | | |

### ⚠️ Alerta de rentabilidad — leer antes de repartir

La Fase 1 se cotizó en **$450.000 ARS** cuando el alcance de Capacitaciones era más chico
(antes de sumar restricción por puesto, notificaciones de vencimiento y el reporte mensual
para YPF, que se agregaron recién en la llamada del 25/09, después de cerrado el precio).

Con la estimación de arriba (80 horas), el costo por hora efectivo de esta fase queda en
**$5.625 ARS/hora** ($450.000 ÷ 80), bastante por debajo de la tarifa base de $9.000/hora
que se usó para cotizar el Módulo 1 originalmente. Esto es consistente con la decisión que
ya está tomada y registrada en `lead-juan-sgi.md` (absorber el scope creep ahora y
recuperarlo cotizando el Upgrade multi-cliente o el Resto de módulos más adelante), así
que no hace falta volver a hablar de plata con Juan por esto. Pero sí vale tenerlo
presente a la hora de asignar horas del equipo a esta fase: al 75% que se reparte por
horas trabajadas, este proyecto rinde menos por hora que otros en el pipeline. Si en algún
momento hay que priorizar en qué proyecto poner las horas disponibles de alguien, esto
pesa en la decisión.

Si 80 horas termina siendo una subestimación (es una primera pasada, no builds todavía),
el lugar más probable para que se dispare es el módulo 6 (Dictado y Asistencia) — es el
que más reglas de negocio cruza (puesto, obligatoriedad, numeración correlativa, estados).
Vale la pena que quien lo tome reporte avance a mitad de camino, no recién al final.

---

## Checklist antes de dar por cerrada esta especificación

- [x] Cada módulo tiene Descripción, Requerimientos funcionales, Notas y Permisos.
- [x] Los endpoints de API tienen sus errores HTTP documentados.
- [x] Quedó explícito qué se borra físicamente y qué se desactiva/anula.
- [ ] **Pendiente de confirmar con Santi**: la decisión del módulo 1 sobre login del
      Operario (kiosco por DNI vs. adelantar cuentas individuales).
- [ ] **Pendiente de confirmar con Santi**: si la estimación de 80 horas es aceptable o si
      hay que recortar alcance de algún módulo (candidatos: vencimientos o reporte mensual,
      que son los menos "vendibles" frente a Juan si hay que simplificar algo).
