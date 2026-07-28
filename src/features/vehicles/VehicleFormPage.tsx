import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import {
  createVehicleForUser,
  getVehicleById,
  updateVehicle,
  type VehicleDraft,
} from './vehiclesApi'

const emptyDraft: VehicleDraft = {
  nickname: '',
  year: null,
  make: '',
  model: '',
  vin: null,
  current_mileage: null,
  notes: null,
}

function parseOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function VehicleFormPage() {
  const { vehicleId } = useParams()
  const isEditing = Boolean(vehicleId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<VehicleDraft>(emptyDraft)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!vehicleId) return
    let isMounted = true

    getVehicleById(vehicleId)
      .then((vehicle) => {
        if (!isMounted) return
        setDraft({
          nickname: vehicle.nickname,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          vin: vehicle.vin,
          current_mileage: vehicle.current_mileage,
          notes: vehicle.notes,
        })
      })
      .catch((error: unknown) => {
        if (isMounted) setFormError(error instanceof Error ? error.message : 'Failed to load vehicle')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [vehicleId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setIsSaving(true)
    setFormError(null)

    try {
      const saved = isEditing && vehicleId
        ? await updateVehicle(vehicleId, draft)
        : await createVehicleForUser(user.id, draft)
      navigate(`/vehicles/${saved.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save vehicle')
      setIsSaving(false)
    }
  }

  if (isLoading) return <p className="page-status">Loading vehicle…</p>

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? 'Edit vehicle' : 'Add vehicle'}</h1>
        <Link to={isEditing && vehicleId ? `/vehicles/${vehicleId}` : '/vehicles'}>Cancel</Link>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Nickname
          <input
            value={draft.nickname}
            onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Year
            <input
              type="number"
              value={draft.year ?? ''}
              onChange={(event) => setDraft({ ...draft, year: parseOptionalNumber(event.target.value) })}
            />
          </label>
          <label>
            Make
            <input
              value={draft.make}
              onChange={(event) => setDraft({ ...draft, make: event.target.value })}
              required
            />
          </label>
          <label>
            Model
            <input
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              required
            />
          </label>
        </div>
        <label>
          VIN
          <input
            value={draft.vin ?? ''}
            onChange={(event) => setDraft({ ...draft, vin: event.target.value || null })}
          />
        </label>
        <label>
          Current mileage
          <input
            type="number"
            value={draft.current_mileage ?? ''}
            onChange={(event) =>
              setDraft({ ...draft, current_mileage: parseOptionalNumber(event.target.value) })
            }
          />
        </label>
        <label>
          Notes
          <textarea
            rows={4}
            value={draft.notes ?? ''}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value || null })}
          />
        </label>
        {formError ? <p className="form-error">{formError}</p> : null}
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save vehicle'}
        </button>
      </form>
    </div>
  )
}
