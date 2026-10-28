/**
 * _shared/pdf.ts — Helpers de pdf-lib compartidos por las Edge Functions que arman PDFs (M7 certificados, M9 reporte).
 */

/**
 * Las fuentes estándar de pdf-lib solo cubren WinAnsi (incluye á, é, ñ, ü…). Un carácter fuera de eso haría fallar
 * el PDF: se le saca el acento (o se la reemplaza por su equivalente ASCII: rayas, comillas, puntos suspensivos) y, si aun así no entra, se reemplaza por '?'.
 */
export function winAnsiSafe(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 256) return ch;
      if (ch === '—' || ch === '–') return '-'; // rayas: están en WinAnsi pero con otro código
      if (ch === '…') return '...';
      if (ch === '“' || ch === '”') return '"';
      if (ch === '‘' || ch === '’') return "'";
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return base.length === 1 && (base.codePointAt(0) ?? 0) < 256 ? base : '?';
    })
    .join('');
}
