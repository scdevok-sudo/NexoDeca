# Cómo trabajamos

## Ramas
- `main`: protegida, solo recibe lo estable.
- `develop`: rama de integración.
- Ramas de trabajo: `feat/mX-descripcion` (ej. `feat/m2-importacion-csv`), `fix/mX-descripcion`.
- Pull Request a `develop`. Revisa Santi.

## Commits
- Atómicos y con la convención `tipo(modulo): descripción`: `feat(m2): importación masiva por CSV`, `fix(m6): nro de registro duplicado`, `chore(setup): ...`, `docs(m7): ...`.
- Antes de un commit grande: `npx tsc --noEmit` y `npm run build`, para no romper el build de otro.

## Qué módulo tomo
- Cada dev elige un módulo según su perfil y su disponibilidad (no hay asignación a dedo). Las fichas están en `docs/modulos/`.
- Anotá tu nombre en el campo **Responsable** de la ficha (`docs/modulos/NN-*.md` y el `README.md` del módulo) en tu primer commit.
- M6 es el más grande y el más central: conviene que lo tome quien pueda dar continuidad semana a semana, y que reporte avance a mitad de camino.
- Podés buscar tus pendientes con `grep -r "TODO(M2)" src supabase`.

## Carga de horas
- En la planilla de reparto, **el mismo día** (máximo dentro de las 48 hs). Nada de reconstruir de memoria a fin de mes.
- Bloques mínimos de 15 minutos, redondeando para arriba.
- Cuenta: desarrollo, diseño, testing, deploy y reuniones de definición con el cliente. No cuenta: coordinación interna entre nosotros.

## Dudas
- De alcance o de una regla de negocio: **primero la spec** del módulo, **después Santi**. No asumas; rehacer cuesta más.
- Si la spec no lo define, dejá `// TODO(consultar a Santi): ...` y avisá.
- Ante cualquier duda sobre horas o reparto, decide Santi.

## Fuera de alcance
Todo lo de Fase 2 (inspecciones/QR, choferes, OPS, dashboard con gráficos, login con Google, firma digital, emails automáticos, multi-cliente) no se construye en esta fase.
