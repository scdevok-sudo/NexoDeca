/**
 * hooks.ts — Hooks de react-query sobre api.ts.
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCertificatesByDni,
  listPersonCertificates,
  listTrainingCertificates,
  getCertificateDownloadUrl,
  generateCertificates,
} from './api';

const KEY = ['certificates'] as const;

/** Consulta pública: es una acción del usuario (enviar el DNI), no algo que se cachea. */
export function useLookupByDni() {
  return useMutation({
    mutationFn: (dni: string) => getCertificatesByDni(dni),
  });
}

export function useListPersonCertificates(personId: string) {
  return useQuery({
    queryKey: [...KEY, 'listPersonCertificates', personId],
    queryFn: () => listPersonCertificates(personId),
    enabled: Boolean(personId),
  });
}

export function useTrainingCertificates(trainingId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, 'listTrainingCertificates', trainingId],
    queryFn: () => listTrainingCertificates(trainingId),
    enabled: enabled && Boolean(trainingId),
  });
}

/** Pide la URL firmada y navega a ella: el PDF se descarga como adjunto, sin salir de la pantalla. */
export function useDownloadCertificate() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = await getCertificateDownloadUrl(id);
      window.location.assign(url);
    },
  });
}

export function useGenerateCertificates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trainingId: string) => generateCertificates(trainingId),
    // Cambia la capacitación (queda cerrada) y aparecen certificados nuevos.
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: KEY }), qc.invalidateQueries({ queryKey: ['trainings'] })]),
  });
}
