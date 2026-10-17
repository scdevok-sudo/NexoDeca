/**
 * routes/index.tsx — Definición central de rutas y guards por rol.
 * Módulo: Setup / M1 (guards) — cada ruta apunta a la página de su módulo.
 *
 * Guards revisados con la autenticación real (M1): /trainers solo gerente.
 * /trainings/new y /trainings/:id/edit: gerente y capacitador (M6: el Gerente puede cargar las propias).
 * PERMISOS: el guard solo mejora la UX; la seguridad real está en RLS / Edge Functions.
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from '../auth/RequireRole';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/ui/EmptyState';
import { LoginPage, TrainerUsersPage } from '../modules/login';
import { PersonnelListPage, PersonnelDetailPage } from '../modules/personnel';
import { PositionsPage } from '../modules/positions';
import { TopicsPage } from '../modules/topics';
import { PlanPage } from '../modules/plan';
import { TrainingsListPage, TrainingFormPage, TrainingDetailPage } from '../modules/trainings';
import { PublicLookupPage } from '../modules/certificates';
import { CompliancePage } from '../modules/compliance';
import { ReportsPage } from '../modules/reports';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/consulta" element={<PublicLookupPage />} />
      <Route
        element={
          <RequireRole roles={['gerente', 'capacitador']}>
            <AppShell />
          </RequireRole>
        }
      >
        <Route path="/" element={<Navigate to="/trainings" replace />} />
        <Route
          path="/trainers"
          element={
            <RequireRole roles={['gerente']}>
              <TrainerUsersPage />
            </RequireRole>
          }
        />
        <Route
          path="/personnel"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <PersonnelListPage />
            </RequireRole>
          }
        />
        <Route
          path="/personnel/:id"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <PersonnelDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/positions"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <PositionsPage />
            </RequireRole>
          }
        />
        <Route
          path="/topics"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <TopicsPage />
            </RequireRole>
          }
        />
        <Route
          path="/plan"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <PlanPage />
            </RequireRole>
          }
        />
        <Route
          path="/trainings"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <TrainingsListPage />
            </RequireRole>
          }
        />
        <Route
          path="/trainings/new"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <TrainingFormPage />
            </RequireRole>
          }
        />
        <Route
          path="/trainings/:id/edit"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <TrainingFormPage />
            </RequireRole>
          }
        />
        <Route
          path="/trainings/:id"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <TrainingDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/compliance"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <CompliancePage />
            </RequireRole>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireRole roles={['gerente', 'capacitador']}>
              <ReportsPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<EmptyState title="Página no encontrada" />} />
    </Routes>
  );
}
