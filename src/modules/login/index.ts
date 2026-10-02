/**
 * index.ts — API pública del módulo (lo único que deben importar otros módulos).
 * Módulo: M1 · Login y sesiones (spec §1)
 */

export * from './types';
export * from './schemas';
export * from './api';
export * from './hooks';
export { LoginForm } from './components/LoginForm';
export { CreateTrainerForm } from './components/CreateTrainerForm';
export { LoginPage } from './pages/LoginPage';
export { TrainerUsersPage } from './pages/TrainerUsersPage';
