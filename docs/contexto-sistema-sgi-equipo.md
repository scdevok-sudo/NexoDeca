# Contexto del proyecto — Sistema de Gestión Integral (SGI) para Nexoris / Deca

> Documento para el equipo de SCdev (Agustín, Ezequiel, Lucas). Explica qué estamos
> construyendo, para quién, y en qué etapa del proyecto estamos ahora. El detalle técnico
> módulo por módulo de lo que hay que construir ya está en la especificación de la Fase 1
> (ver el final de este documento).

**Fecha:** 02/10/2026

---

## El cliente y el problema que resolvemos

**Juan Sequeira** es consultor y auditor de Sistemas de Gestión Integral (Calidad,
Seguridad e Higiene, Medio Ambiente) para PyMEs que trabajan como contratistas de YPF, en
la zona de La Plata/Ensenada. Su consultora se llama **Nexoris**.

El modelo de negocio de Juan: él le vende el sistema a sus clientes, les cobra un
mantenimiento mensual, y si un cliente quiere algo nuevo se cotiza aparte. Nosotros somos
su socio informático — construimos y mantenemos la plataforma, él la vende y la usa con
sus clientes.

Su primer cliente piloto es **Deca Electromecánica S.A.** Hoy Deca gestiona todo esto
(capacitaciones, inspecciones de equipos, seguridad e higiene) a mano: Google Drive,
planillas Excel, checklists en papel. El objetivo del sistema es reemplazar ese circuito
manual por una plataforma web, empezando por lo más urgente para Juan: las capacitaciones
del personal, que tiene que reportar todos los meses a YPF.

## El roadmap completo (por qué construimos esto en etapas)

Decidimos no construir un sistema genérico multi-cliente desde el día uno. Vamos por
etapas, cada una justificada por una necesidad real del momento:

1. **Fase 1 — Capacitaciones (donde estamos ahora)**: sistema funcional para un solo
   cliente (Deca), sin arquitectura multi-tenant ni motor de formularios genérico. El
   objetivo es tener algo funcionando rápido y bien hecho para el caso concreto de Deca.
2. **Fase 2 — Equipos, inspecciones, dashboard y accesos**: arranca una vez entregada y
   aprobada la Fase 1. Suma inspecciones de equipos/vehículos con QR, herramientas,
   choferes, consulta de procedimientos, OPS (Observaciones Preventivas de Seguridad)
   ampliado, dashboard con gráficos, login individual con cuenta de Google, y firma
   digital en los formularios.
3. **Upgrade a multi-cliente (cuando Juan consiga su segundo cliente)**: recién ahí se
   justifica invertir en arquitectura multi-tenant real, editor de checklists sin código,
   y generador de pack HSE. El mantenimiento va a subir en función de la cantidad de
   clientes activos de Juan.
4. **Resto de módulos (Compras, RRHH, Dirección)**: más adelante, sobre la base ya
   multi-tenant.

Esto importa para entender las decisiones de diseño que vas a ver en la especificación: si
algo parece "resuelto de forma simple" en vez de genérico (por ejemplo, catálogos
hardcodeados en vez de un motor de formularios configurable), es a propósito — no tiene
sentido construir infraestructura multi-cliente para un solo cliente.

## En qué fase estamos ahora

**El proyecto está confirmado y el acuerdo firmado con Juan.** Pasamos de demo a
desarrollo funcional real. Esto es lo que se acordó para la Fase 1:

- **Alcance**: Capacitaciones completo — plan anual de capacitación mensualizado, cursos
  obligatorios y electivos restringidos por puesto de trabajo, registro de quién dio y
  quién tomó cada curso, certificado automático en PDF, seguimiento de vencimientos, y el
  reporte mensual que Juan tiene que entregarle a YPF.
- **Precio**: $450.000 ARS, en dos pagos ($225.000 al confirmar el proyecto + $225.000 a
  la entrega de la Fase 1).
- **Stack definido en el acuerdo**: React + Vite + Tailwind (frontend, reconstruyendo la
  demo existente sobre datos reales), Supabase — PostgreSQL + Auth + Storage (backend),
  Vercel (hosting).
- **Mantenimiento** ($195.000/mes): no arranca automáticamente a la entrega, sino cuando
  el sistema esté funcionando con al menos un cliente activo de Juan. Si Deca tarda en
  confirmar, el mantenimiento queda pausado hasta entonces.

Juan va a seguir el avance mirando el mismo link de demo en vivo, y manda feedback por
audios de WhatsApp en vez de reuniones largas.

## Qué hay que construir ahora

La especificación completa de la Fase 1 — módulo por módulo, con requerimientos
funcionales, reglas de negocio, permisos por rol, y los endpoints de API necesarios — está
en:

**`claude/especificacion-modulo1-fase1-capacitaciones.md`**

Ahí también está la división de tareas con la habilidad/perfil requerido por módulo y las
horas estimadas (80 h en total), para que cada uno elija qué módulo tomar según lo que
maneja mejor y tenga disponible esa semana.

Dos decisiones todavía están pendientes de que Santi las confirme antes de arrancar (están
marcadas en la especificación): cómo accede el Operario (empleado de Deca) a sus propias
capacitaciones sin tener login en esta fase, y si las 80 horas estimadas son aceptables o
hay que recortar algo. No deberían bloquear el arranque de los módulos que no dependen de
eso (Setup, Personal, Puestos, Catálogo de Temas).

Lo que **no** hay que construir todavía, aunque se mencione como referencia futura en la
especificación: inspecciones de equipos/vehículos, choferes, OPS, dashboard con gráficos,
login con Google, firma digital, notificaciones automáticas por correo electrónico, y
cualquier cosa de arquitectura multi-cliente. Todo eso es Fase 2 o más adelante.

## Cómo se reparte el trabajo y se cobra

Esto no es un trabajo en relación de dependencia: cada uno colabora según lo que puede
aportar, eligiendo tareas de la especificación según su disponibilidad y lo que maneja
mejor. Las reglas del esquema de colaboración:

- **Reparto**: de lo que se cobra por el proyecto, SCdev retiene un 25% (cubre estructura),
  y el 75% restante se reparte proporcional a las horas que cada uno cargó en ese proyecto
  puntual.
- **Registro de horas**: se carga en la planilla de reparto de equipo, el mismo día o
  como máximo dentro de las 48 hs — nada de reconstruir de memoria a fin de mes. Bloques
  mínimos de 15 minutos, redondeando para arriba. Cuenta como hora facturable: desarrollo,
  diseño, testing, deploy, reuniones de definición con el cliente. No cuenta: coordinación
  interna entre nosotros.
- **Cobro**: se liquida en cada pago real que hace Juan (el del inicio de la Fase 1 y el de
  la entrega), proporcional a las horas cargadas hasta ese momento.
- Ante cualquier duda o desacuerdo sobre horas o reparto, decide Santi — es quien factura y
  responde ante el cliente.

## Flujo de trabajo técnico

- Versionar todo con git, commits atómicos. Antes de un commit grande, correr
  `tsc --noEmit` / `npm run build` para no romper el build de otro.
- Toda interacción con la base de datos a través del cliente de Supabase (no armar queries
  SQL a mano) y contraseñas gestionadas por Supabase Auth (no implementar hash a mano).
- Todas las vistas tienen que ser responsive — la demo ya pasó esa auditoría una vez
  (< 767px, 768–1024px, > 1025px), hay que mantenerla al reconstruir sobre datos reales.
- Los permisos por rol se verifican siempre del lado del servidor (o en las políticas RLS
  de Supabase), nunca solo ocultando un botón en el frontend.
- Dudas puntuales de alcance o de una regla de negocio: consultar primero la
  especificación del módulo correspondiente; si no está ahí, preguntarle a Santi antes de
  asumir algo, para no tener que rehacer trabajo después.

---

**Para el detalle técnico completo de cada módulo** (requerimientos, reglas de negocio,
permisos, endpoints de API), ver `claude/especificacion-modulo1-fase1-capacitaciones.md`.
