/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M4 · Catálogo de Capacitaciones (Temas) (spec §4)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { TopicsTable } from './components/TopicsTable';
export { TopicFilters } from './components/TopicFilters';
export { TopicForm } from './components/TopicForm';
export { TopicsPage } from './pages/TopicsPage';
