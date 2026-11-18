/**
 * components/ui/FileInput.tsx — Selector de archivo con la identidad del sistema.
 * Módulo: Setup.
 *
 * El <input type="file"> nativo queda oculto (sr-only) y un Button secundario lo dispara; al lado va el nombre del archivo.
 * El archivo elegido lo maneja quien lo usa (`file` + `onChange`); si `file` vuelve a null, se limpia el input nativo.
 */

import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

interface Props {
  label?: string;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Texto de ayuda debajo del control. */
  hint?: string;
  buttonText?: string;
}

export function FileInput({ label, accept, file, onChange, hint, buttonText = 'Elegir archivo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = '';
  }, [file]);

  return (
    <div className="text-sm">
      {label && (
        <span id={labelId} className="mb-1 block font-medium text-slate-700">
          {label}
        </span>
      )}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-labelledby={label ? labelId : undefined}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="secondary" className="shrink-0" onClick={() => inputRef.current?.click()}>
          {buttonText}
        </Button>
        <span className="min-w-0 truncate text-slate-500" title={file?.name}>
          {file ? file.name : 'Ningún archivo seleccionado'}
        </span>
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </div>
  );
}
