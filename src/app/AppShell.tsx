import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function AppShell() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <NavLink to="/" className="brand-name">
            Fleet
          </NavLink>
          <p className="brand-tagline">Personal garage</p>
        </div>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/vehicles">Vehicles</NavLink>
          <NavLink to="/research">Research</NavLink>
        </nav>
        <div className="session-block">
          <span className="session-email">{user?.email}</span>
          <button type="button" className="button-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
