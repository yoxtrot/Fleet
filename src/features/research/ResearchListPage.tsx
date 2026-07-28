import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from '../vehicles/vehiclesApi'
import { listResearchNotesForUser } from './researchApi'
import type { FixResearchNote, Vehicle } from '../../lib/database.types'

export function ResearchListPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<FixResearchNote[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    Promise.all([listResearchNotesForUser(user.id), listVehiclesForUser(user.id)])
      .then(([noteRows, vehicleRows]) => {
        if (!isMounted) return
        setNotes(noteRows)
        setVehicles(vehicleRows)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load research')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const vehicleNicknameById = useMemo(() => {
    return new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.nickname]))
  }, [vehicles])

  const filteredNotes = useMemo(() => {
    const normalizedTag = tagFilter.trim().toLowerCase()
    return notes.filter((note) => {
      const matchesVehicle = vehicleFilter === 'all' || note.vehicle_id === vehicleFilter
      const matchesTag =
        normalizedTag === '' || note.tags.some((tag) => tag.toLowerCase().includes(normalizedTag))
      return matchesVehicle && matchesTag
    })
  }, [notes, vehicleFilter, tagFilter])

  if (isLoading) return <p className="page-status">Loading research…</p>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Fix research</h1>
        <Link className="button-primary" to="/research/new">
          New note
        </Link>
      </div>

      <div className="filter-row">
        <label>
          Vehicle
          <select value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)}>
            <option value="all">All vehicles</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag contains
          <input value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} placeholder="brakes" />
        </label>
      </div>

      {loadError ? <p className="form-error">{loadError}</p> : null}

      {filteredNotes.length === 0 && !loadError ? (
        <p className="muted">No research notes match these filters.</p>
      ) : (
        <ul className="card-list">
          {filteredNotes.map((note) => (
            <li key={note.id}>
              <Link to={`/research/${note.id}`} className="card-link">
                <strong>{note.title}</strong>
                <span className="muted">
                  {note.vehicle_id ? vehicleNicknameById.get(note.vehicle_id) ?? 'Unknown vehicle' : 'No vehicle'}
                </span>
                {note.tags.length > 0 ? <span className="muted">{note.tags.join(', ')}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
