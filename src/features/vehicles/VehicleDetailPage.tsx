import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { deleteVehicle, getVehicleById } from './vehiclesApi'
import { MaintenanceSection } from '../maintenance/MaintenanceSection'
import type { Vehicle } from '../../lib/database.types'

export function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return
    let isMounted = true

    getVehicleById(vehicleId)
      .then((row) => {
        if (isMounted) setVehicle(row)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load vehicle')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [vehicleId])

  async function handleDelete() {
    if (!vehicleId || !vehicle) return
    const confirmed = window.confirm(`Delete ${vehicle.nickname}? This also removes its maintenance records.`)
    if (!confirmed) return
    await deleteVehicle(vehicleId)
    navigate('/vehicles')
  }

  if (isLoading) return <p className="page-status">Loading vehicle…</p>
  if (loadError || !vehicle || !vehicleId || !user) {
    return (
      <div className="page">
        <p className="form-error">{loadError ?? 'Vehicle not found'}</p>
        <Link to="/vehicles">Back to vehicles</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <Link to="/vehicles">Vehicles</Link>
          </p>
          <h1>{vehicle.nickname}</h1>
          <p className="muted">{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}</p>
        </div>
        <div className="button-row">
          <Link className="button-secondary" to={`/vehicles/${vehicle.id}/edit`}>
            Edit
          </Link>
          <button type="button" className="button-danger" onClick={() => void handleDelete()}>
            Delete
          </button>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>VIN</dt>
          <dd>{vehicle.vin || '—'}</dd>
        </div>
        <div>
          <dt>Mileage</dt>
          <dd>{vehicle.current_mileage != null ? `${vehicle.current_mileage.toLocaleString()} mi` : '—'}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{vehicle.notes || '—'}</dd>
        </div>
      </dl>

      <MaintenanceSection vehicleId={vehicleId} userId={user.id} />
    </div>
  )
}
