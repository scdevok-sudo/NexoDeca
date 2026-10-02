/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M7 · Certificados (spec §7)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { DniLookupForm } from './components/DniLookupForm';
export { CertificateList } from './components/CertificateList';
export { PersonCertificatesPanel } from './components/PersonCertificatesPanel';
export { PublicLookupPage } from './pages/PublicLookupPage';
