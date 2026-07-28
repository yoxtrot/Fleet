import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { PageLoadingState } from '../shared/PageLoadingState'

export function ProtectedRoute() {
  const { user, isLoadingSession } = useAuth()

  if (isLoadingSession) {
    return <PageLoadingState label="Checking your session…" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
