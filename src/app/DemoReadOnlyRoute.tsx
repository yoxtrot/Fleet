import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './AuthProvider'

/** Blocks create/edit routes while viewing the read-only demo garage. */
export function DemoReadOnlyRoute() {
  const { isDemoMode } = useAuth()
  const { vehicleId, projectId, noteId } = useParams()
  const location = useLocation()

  if (!isDemoMode) return <Outlet />

  if (projectId && vehicleId) {
    return <Navigate to={`/vehicles/${vehicleId}/projects/${projectId}`} replace />
  }
  if (vehicleId) {
    return <Navigate to={`/vehicles/${vehicleId}`} replace />
  }
  if (noteId) {
    return <Navigate to={`/research/${noteId}`} replace />
  }
  if (location.pathname.startsWith('/research')) {
    return <Navigate to="/research" replace />
  }
  if (location.pathname.startsWith('/vehicles')) {
    return <Navigate to="/vehicles" replace />
  }
  return <Navigate to="/" replace />
}
