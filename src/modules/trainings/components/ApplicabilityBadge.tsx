/**
 * components/ApplicabilityBadge.tsx — Obligatorio / Electivo / No correspondía.
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 *
 * Qué tiene que hacer:
 *  - "No correspondía" es alerta, no bloqueo.
 */

import { Badge } from '../../../components/ui/Badge';
import type { Applicability } from '../../../types/common';
import type { TopicOption } from '../types';

const LABELS: Record<Applicability, string> = {
  obligatorio: 'Obligatorio',
  electivo: 'Electivo',
  no_correspondia: 'No le correspondía',
};

const TONES: Record<Applicability, 'success' | 'neutral' | 'warning'> = {
  obligatorio: 'success',
  electivo: 'neutral',
  no_correspondia: 'warning',
};

/**
 * Anticipa en pantalla lo que va a calcular el servidor (training_relevance, 0019): si el puesto está entre los
 * puestos del tema → el tipo del tema; si no → no correspondía. Lo que se guarda lo calcula SIEMPRE el servidor.
 */
export function previewApplicability(topic: TopicOption | undefined, puestoId: string): Applicability | null {
  if (!topic) return null;
  return topic.puestoIds.includes(puestoId) ? topic.tipo : 'no_correspondia';
}

export function ApplicabilityBadge({ value }: { value: Applicability }) {
  return <Badge tone={TONES[value]}>{LABELS[value]}</Badge>;
}
