import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from './vehiclesApi'
import type { Vehicle } from '../../lib/database.types'

export function VehicleListPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    listVehiclesForUser(user.id)
      .then((rows) => {
        if (isMounted) setVehicles(rows)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load vehicles')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user])

  if (isLoading) return <p className="page-status">Loading vehicles…</p>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Vehicles</h1>
        <Link className="button-primary" to="/vehicles/new">
          Add vehicle
        </Link>
      </div>
      {loadError ? <p className="form-error">{loadError}</p> : null}
      {vehicles.length === 0 && !loadError ? (
        <p className="muted">Your fleet is empty. Add a vehicle to get started.</p>
      ) : (
        <ul className="card-list">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <Link to={`/vehicles/${vehicle.id}`} className="card-link">
                <strong>{vehicle.nickname}</strong>
                <span className="muted">
                  {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                </span>
                {vehicle.current_mileage != null ? (
                  <span className="muted">{vehicle.current_mileage.toLocaleString()} mi</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
