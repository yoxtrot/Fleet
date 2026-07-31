import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { AppShell } from './AppShell'
import { DemoReadOnlyRoute } from './DemoReadOnlyRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { LandingPage } from '../features/landing/LandingPage'
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

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: 'home', element: <DashboardPage /> },
          { path: 'vehicles', element: <VehicleListPage /> },
          { path: 'vehicles/:vehicleId', element: <VehicleDetailPage /> },
          {
            path: 'vehicles/:vehicleId/projects/:projectId',
            element: <ProjectDetailPage />,
          },
          { path: 'research', element: <ResearchListPage /> },
          { path: 'research/:noteId', element: <ResearchDetailPage /> },
          {
            element: <DemoReadOnlyRoute />,
            children: [
              { path: 'vehicles/new', element: <VehicleFormPage /> },
              { path: 'vehicles/:vehicleId/edit', element: <VehicleFormPage /> },
              { path: 'vehicles/:vehicleId/projects/new', element: <ProjectFormPage /> },
              {
                path: 'vehicles/:vehicleId/projects/:projectId/edit',
                element: <ProjectFormPage />,
              },
              { path: 'research/new', element: <ResearchFormPage /> },
              { path: 'research/:noteId/edit', element: <ResearchFormPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
