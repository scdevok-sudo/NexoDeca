/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M5 · Plan Anual de Capacitación (spec §5)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { PlanMonthColumn } from './components/PlanMonthColumn';
export { PlanTopicPicker } from './components/PlanTopicPicker';
export { CopyPlanModal } from './components/CopyPlanModal';
export { ExpectedAttendeesPanel } from './components/ExpectedAttendeesPanel';
export { PlanPage } from './pages/PlanPage';
