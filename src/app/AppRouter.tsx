import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { AppShell } from './AppShell'
import { DemoReadOnlyRoute } from './DemoReadOnlyRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { VehicleListPage } from '../features/vehicles/VehicleListPage'
import { VehicleDetailPage } from '../features/vehicles/VehicleDetailPage'
import { VehicleFormPage } from '../features/vehicles/VehicleFormPage'
import { ProjectFormPage } from '../features/projects/ProjectFormPage'
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage'
import { ResearchListPage } from '../features/research/ResearchListPage'
import { ResearchFormPage } from '../features/research/ResearchFormPage'
import { ResearchDetailPage } from '../features/research/ResearchDetailPage'

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="vehicles" element={<VehicleListPage />} />
              <Route path="vehicles/:vehicleId" element={<VehicleDetailPage />} />
              <Route path="vehicles/:vehicleId/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="research" element={<ResearchListPage />} />
              <Route path="research/:noteId" element={<ResearchDetailPage />} />

              <Route element={<DemoReadOnlyRoute />}>
                <Route path="vehicles/new" element={<VehicleFormPage />} />
                <Route path="vehicles/:vehicleId/edit" element={<VehicleFormPage />} />
                <Route path="vehicles/:vehicleId/projects/new" element={<ProjectFormPage />} />
                <Route
                  path="vehicles/:vehicleId/projects/:projectId/edit"
                  element={<ProjectFormPage />}
                />
                <Route path="research/new" element={<ResearchFormPage />} />
                <Route path="research/:noteId/edit" element={<ResearchFormPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
