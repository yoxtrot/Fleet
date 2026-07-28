import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from '../vehicles/vehiclesApi'
import { listRecentMaintenanceForUser } from '../maintenance/maintenanceApi'
import { listRecentResearchForUser } from '../research/researchApi'
import type { Vehicle, MaintenanceRecord, FixResearchNote } from '../../lib/database.types'

export function DashboardPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceRecord[]>([])
  const [recentResearch, setRecentResearch] = useState<FixResearchNote[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    async function loadDashboard() {
      try {
        const [vehicleRows, maintenanceRows, researchRows] = await Promise.all([
          listVehiclesForUser(user!.id),
          listRecentMaintenanceForUser(user!.id),
          listRecentResearchForUser(user!.id),
        ])
        if (!isMounted) return
        setVehicles(vehicleRows)
        setRecentMaintenance(maintenanceRows)
        setRecentResearch(researchRows)
      } catch (error) {
        if (!isMounted) return
        setLoadError(error instanceof Error ? error.message : 'Failed to load dashboard')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      isMounted = false
    }
  }, [user])

  if (isLoading) return <p className="page-status">Loading garage…</p>
  if (loadError) {
    return (
      <div className="page">
        <h1>Home</h1>
        <p className="form-error">{loadError}</p>
        <p className="muted">
          If this mentions a missing table, finish the SQL migration steps in{' '}
          <code>docs/supabase-setup.md</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Home</h1>
        <Link className="button-secondary" to="/vehicles/new">
          Add vehicle
        </Link>
      </div>

      <section className="summary-grid">
        <div>
          <p className="summary-label">Vehicles</p>
          <p className="summary-value">{vehicles.length}</p>
        </div>
        <div>
          <p className="summary-label">Recent maintenance</p>
          <p className="summary-value">{recentMaintenance.length}</p>
        </div>
        <div>
          <p className="summary-label">Recent research</p>
          <p className="summary-value">{recentResearch.length}</p>
        </div>
      </section>

      <section className="stack-section">
        <h2>Your vehicles</h2>
        {vehicles.length === 0 ? (
          <p className="muted">No vehicles yet. Add your first one to start logging work.</p>
        ) : (
          <ul className="plain-list">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <Link to={`/vehicles/${vehicle.id}`}>{vehicle.nickname}</Link>
                <span className="muted">
                  {' '}
                  — {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack-section">
        <h2>Recent maintenance</h2>
        {recentMaintenance.length === 0 ? (
          <p className="muted">No maintenance logged yet.</p>
        ) : (
          <ul className="plain-list">
            {recentMaintenance.map((record) => (
              <li key={record.id}>
                <strong>{record.title}</strong>
                <span className="muted"> — {record.performed_on}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack-section">
        <div className="section-header">
          <h2>Recent research</h2>
          <Link to="/research/new">New note</Link>
        </div>
        {recentResearch.length === 0 ? (
          <p className="muted">No research notes yet.</p>
        ) : (
          <ul className="plain-list">
            {recentResearch.map((note) => (
              <li key={note.id}>
                <Link to={`/research/${note.id}`}>{note.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
