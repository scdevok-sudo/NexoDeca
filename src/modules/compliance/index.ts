/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M8 · Vencimientos y notificaciones (spec §8)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { ComplianceTable } from './components/ComplianceTable';
export { ComplianceFilters } from './components/ComplianceFilters';
export { CompliancePage } from './pages/CompliancePage';
