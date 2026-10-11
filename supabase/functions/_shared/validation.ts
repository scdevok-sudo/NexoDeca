/**
 * _shared/validation.ts — Validaciones del servidor (repiten las de zod del frontend).
 * Módulo: compartido (creado desde M1/M2). Mantener en sync con src/modules/personnel/schemas.ts
 * y src/modules/login/schemas.ts.
 */

/** Nombre/apellido: arranca con letra → bloquea inyección de fórmulas (=, +, -, @) al exportar a Excel. */
const NAME_RE = /^\p{L}[\p{L}\s'.-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeDni(raw: string): string | null {
  const dni = raw.trim().replace(/[.\s]/g, '');
  return /^\d{7,8}$/.test(dni) ? dni : null;
}

export function normalizeName(raw: string, max = 80): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  return name.length >= 1 && name.length <= max && NAME_RE.test(name) ? name : null;
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/** Acepta AAAA-MM-DD o DD/MM/AAAA. Devuelve AAAA-MM-DD o null si la fecha no existe. */
export function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  let iso: string | null = null;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) iso = `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null;
}
