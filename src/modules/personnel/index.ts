/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M2 · Gestión de Personal (spec §2)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { PersonnelTable } from './components/PersonnelTable';
export { PersonnelFilters } from './components/PersonnelFilters';
export { PersonForm } from './components/PersonForm';
export { PersonnelImportModal } from './components/PersonnelImportModal';
export { PersonnelListPage } from './pages/PersonnelListPage';
export { PersonnelDetailPage } from './pages/PersonnelDetailPage';
