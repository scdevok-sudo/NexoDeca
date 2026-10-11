/**
 * _shared/csv.ts — Decodificación y parseo de CSV (sin dependencias).
 * Módulo: M2 · Gestión de Personal (lo usa import-personnel; tests en csv.test.ts).
 */

import { badRequest } from './errors.ts';

export interface CsvRow {
  /** Número de línea del archivo donde empieza la fila (1 = encabezado). */
  line: number;
  cells: string[];
}

export function decode(bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Excel en Windows suele exportar en Windows-1252.
    text = new TextDecoder('windows-1252').decode(bytes);
  }
  return text.replace(/^\uFEFF/, '');
}

/** Parser CSV mínimo: comillas dobles, comillas escapadas ("") y saltos de línea dentro de comillas. */
export function parseCsv(text: string, sep: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = '';
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else {
        if (ch === '\n') line++;
        cell += ch;
      }
    } else if (ch === '"') inQuotes = true;
    else if (ch === sep) {
      cells.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cells.push(cell);
      rows.push({ line: rowLine, cells });
      cells = [];
      cell = '';
      line++;
      rowLine = line;
    } else cell += ch;
  }
  if (inQuotes) throw badRequest('El CSV tiene comillas sin cerrar');
  if (cell !== '' || cells.length > 0) {
    cells.push(cell);
    rows.push({ line: rowLine, cells });
  }
  return rows.filter((r) => r.cells.some((c) => c.trim() !== ''));
}

export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

export function normalizeKey(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


/** Elige ";" si en el encabezado hay más ";" que "," (Excel en español exporta con ";"). */
export function detectSeparator(text: string): ';' | ',' {
  const first = text.split(/\r?\n/, 1)[0] ?? '';
  return (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ',';
}
