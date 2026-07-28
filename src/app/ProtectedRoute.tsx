import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute() {
  const { user, isLoadingSession } = useAuth()

  if (isLoadingSession) {
    return <p className="page-status">Checking your session…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
