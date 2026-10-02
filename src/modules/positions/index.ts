/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M3 · Puestos y Tipos de Personal (spec §3)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { PositionsTable } from './components/PositionsTable';
export { PositionForm } from './components/PositionForm';
export { PositionsPage } from './pages/PositionsPage';
