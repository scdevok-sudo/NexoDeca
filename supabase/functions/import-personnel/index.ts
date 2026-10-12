/**
 * import-personnel — Importación masiva de personal por CSV.
 * Módulo: M2 · Gestión de Personal (spec §2, POST /personnel/import)
 *
 * POST multipart/form-data, campo "file" (.csv, máx. 1 MB, máx. 2000 filas).
 * Formato: primera fila = encabezado con las columnas dni, nombre, apellido, puesto, fecha_ingreso
 *   (en cualquier orden, sin importar mayúsculas/acentos). Separador "," o ";" (Excel en español usa ";").
 *   Codificación UTF-8 o Windows-1252. Fecha AAAA-MM-DD o DD/MM/AAAA. Puesto por nombre.
 * Respuesta: { procesados, importados, rechazados: [{ fila, motivo }] } (fila = línea del archivo).
 * Errores: 400 archivo con formato inválido · 401 · 403 · 405 · 413 archivo muy grande.
 *
 * PERMISOS: solo Gerente. Los inserts se hacen con el JWT del usuario (RLS aplica), no con la service role.
 * REGLA DE NEGOCIO: informar procesados, importados y rechazados, con el motivo de cada rechazo.
 * REGLA DE NEGOCIO: DNI único (también dentro del mismo archivo); puesto existente y activo.
 * TODO(consultar a Santi): confirmar el formato si Juan ya tiene una planilla modelo.
 */

import { handleCors } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { HttpError, badRequest, errorToResponse, jsonResponse } from '../_shared/errors.ts';
import { log } from '../_shared/logger.ts';
import { readFormDataLimited } from '../_shared/body.ts';
import { decode, detectSeparator, normalizeHeader, normalizeKey, parseCsv } from '../_shared/csv.ts';
import { userClient } from '../_shared/supabase.ts';
import { normalizeDate, normalizeDni, normalizeName } from '../_shared/validation.ts';

const FN = 'import-personnel';
const MAX_BYTES = 1024 * 1024;
const MAX_ROWS = 2000;
const CHUNK = 200;
const REQUIRED = ['dni', 'nombre', 'apellido', 'puesto', 'fecha_ingreso'] as const;
type Column = (typeof REQUIRED)[number];

interface Rejection {
  fila: number;
  motivo: string;
}

interface ValidRow {
  fila: number;
  dni: string;
  nombre: string;
  apellido: string;
  position_id: string;
  fecha_ingreso: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const caller = await requireRole(req, ['gerente']);
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    // Tope del cuerpo completo (archivo + overhead multipart), cortando el stream: no se confía en Content-Length.
    const form = await readFormDataLimited(req, MAX_BYTES + 64 * 1024);
    const file = form.get('file');
    if (!(file instanceof File)) throw badRequest('Falta el archivo (campo "file")');
    if (!file.name.toLowerCase().endsWith('.csv')) throw badRequest('El archivo tiene que ser .csv');
    if (file.size === 0) throw badRequest('El archivo está vacío');
    if (file.size > MAX_BYTES) throw new HttpError(413, 'El archivo supera 1 MB');

    const text = decode(new Uint8Array(await file.arrayBuffer()));
    const rows = parseCsv(text, detectSeparator(text));
    if (rows.length < 2) throw badRequest('El CSV no tiene filas de datos');

    const header = rows[0].cells.map(normalizeHeader);
    const index = {} as Record<Column, number>;
    for (const col of REQUIRED) {
      const i = header.indexOf(col);
      if (i === -1) throw badRequest(`Falta la columna "${col}" en el encabezado`, { esperadas: REQUIRED });
      index[col] = i;
    }
    const dataRows = rows.slice(1);
    if (dataRows.length > MAX_ROWS) throw badRequest(`Máximo ${MAX_ROWS} filas por archivo`);

    const db = userClient(caller.jwt);

    // Puestos: nombre normalizado → { id, activo }.
    const { data: positions, error: posError } = await db.from('positions').select('id, nombre, activo');
    if (posError) throw new HttpError(500, 'No se pudieron leer los puestos');
    const positionByName = new Map<string, { id: string; activo: boolean }>();
    for (const p of positions ?? []) positionByName.set(normalizeKey(p.nombre), { id: p.id, activo: p.activo });

    const rejected: Rejection[] = [];
    const candidates: ValidRow[] = [];
    const seenInFile = new Map<string, number>();

    for (const { line, cells } of dataRows) {
      const get = (c: Column) => (cells[index[c]] ?? '').trim();
      const dni = normalizeDni(get('dni'));
      const nombre = normalizeName(get('nombre'));
      const apellido = normalizeName(get('apellido'));
      const fecha = normalizeDate(get('fecha_ingreso'));
      const puestoNombre = get('puesto');
      const position = positionByName.get(normalizeKey(puestoNombre));

      const reasons: string[] = [];
      if (!dni) reasons.push('DNI inválido (7 u 8 dígitos)');
      if (!nombre) reasons.push('nombre inválido');
      if (!apellido) reasons.push('apellido inválido');
      if (!fecha) reasons.push('fecha de ingreso inválida');
      if (!puestoNombre) reasons.push('falta el puesto');
      else if (!position) reasons.push('el puesto no existe');
      else if (!position.activo) reasons.push('el puesto está inactivo');
      if (dni && seenInFile.has(dni)) reasons.push(`DNI repetido en el archivo (fila ${seenInFile.get(dni)})`);

      if (reasons.length > 0) {
        rejected.push({ fila: line, motivo: reasons.join('; ') });
        continue;
      }
      seenInFile.set(dni!, line);
      candidates.push({
        fila: line,
        dni: dni!,
        nombre: nombre!,
        apellido: apellido!,
        position_id: position!.id,
        fecha_ingreso: fecha!,
      });
    }

    // DNIs que ya existen en la base.
    const existing = new Set<string>();
    for (let i = 0; i < candidates.length; i += 300) {
      const dnis = candidates.slice(i, i + 300).map((c) => c.dni);
      const { data, error } = await db.from('personnel').select('dni').in('dni', dnis);
      if (error) throw new HttpError(500, 'No se pudo verificar los DNI existentes');
      for (const r of data ?? []) existing.add(r.dni);
    }
    const toInsert = candidates.filter((c) => {
      if (!existing.has(c.dni)) return true;
      rejected.push({ fila: c.fila, motivo: 'ya existe una persona con ese DNI' });
      return false;
    });

    let imported = 0;
    const toDb = ({ fila: _fila, ...row }: ValidRow) => row;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK);
      const { error } = await db.from('personnel').insert(chunk.map(toDb));
      if (!error) {
        imported += chunk.length;
        continue;
      }
      // Si el lote falla (ej. alguien cargó un DNI en paralelo), se reintenta fila por fila para informar el motivo.
      for (const row of chunk) {
        const { error: rowError } = await db.from('personnel').insert(toDb(row));
        if (!rowError) imported++;
        else if (rowError.code === '23505') rejected.push({ fila: row.fila, motivo: 'ya existe una persona con ese DNI' });
        else if (rowError.code === 'P0001') rejected.push({ fila: row.fila, motivo: rowError.message });
        else if (rowError.code === '42501') throw new HttpError(403, 'No tenés permiso para importar personal');
        else rejected.push({ fila: row.fila, motivo: 'no se pudo guardar' });
      }
    }

    rejected.sort((a, b) => a.fila - b.fila);
    // Sin datos personales en los logs: solo conteos.
    log(FN, 'info', 'importación terminada', {
      by: caller.id,
      procesados: dataRows.length,
      importados: imported,
      rechazados: rejected.length,
    });
    return jsonResponse(200, { procesados: dataRows.length, importados: imported, rechazados: rejected });
  } catch (err) {
    if (!(err instanceof HttpError)) log(FN, 'error', 'error inesperado', { error: String(err) });
    return errorToResponse(err);
  }
});
