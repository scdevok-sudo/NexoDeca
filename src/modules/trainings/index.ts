/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M6 · Dictado y Asistencia (spec §6)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { TrainingsTable } from './components/TrainingsTable';
export { TrainingFilters } from './components/TrainingFilters';
export { TrainingForm } from './components/TrainingForm';
export { AttendeePicker } from './components/AttendeePicker';
export { ApplicabilityBadge } from './components/ApplicabilityBadge';
export { VoidTrainingModal } from './components/VoidTrainingModal';
export { TrainingsListPage } from './pages/TrainingsListPage';
export { TrainingFormPage } from './pages/TrainingFormPage';
export { TrainingDetailPage } from './pages/TrainingDetailPage';
