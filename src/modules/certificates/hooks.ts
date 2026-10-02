/**
 * hooks.ts — Hooks de react-query sobre api.ts (stubs).
 * Módulo: M7 · Certificados (spec §7)
 *
 * Qué tiene que hacer:
 *  - Definir claves de cache e invalidaciones al mutar.
 *  - Las GET son useQuery; el resto useMutation.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { getCertificatesByDni, listPersonCertificates, downloadCertificate, generateCertificates } from './api';

// TODO(M7): invalidar/actualizar el cache de react-query donde corresponda.
export function useGetCertificatesByDni(...args: Parameters<typeof getCertificatesByDni>) {
  return useQuery({
    queryKey: ['certificates', 'getCertificatesByDni', ...args],
    queryFn: () => getCertificatesByDni(...args),
  });
}

// TODO(M7): invalidar/actualizar el cache de react-query donde corresponda.
export function useListPersonCertificates(...args: Parameters<typeof listPersonCertificates>) {
  return useQuery({
    queryKey: ['certificates', 'listPersonCertificates', ...args],
    queryFn: () => listPersonCertificates(...args),
  });
}

// TODO(M7): invalidar/actualizar el cache de react-query donde corresponda.
export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (args: Parameters<typeof downloadCertificate>) => downloadCertificate(...args),
  });
}

// TODO(M7): invalidar/actualizar el cache de react-query donde corresponda.
export function useGenerateCertificates() {
  return useMutation({
    mutationFn: (args: Parameters<typeof generateCertificates>) => generateCertificates(...args),
  });
}
