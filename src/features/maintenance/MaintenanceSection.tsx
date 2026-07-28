import { useEffect, useState, type FormEvent } from 'react'
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  listMaintenanceForVehicle,
  type MaintenanceDraft,
} from './maintenanceApi'
import type { MaintenanceRecord } from '../../lib/database.types'

type MaintenanceSectionProps = {
  vehicleId: string
  userId: string
}

function dollarsToCents(value: string) {
  if (value.trim() === '') return null
  const dollars = Number(value)
  if (!Number.isFinite(dollars)) return null
  return Math.round(dollars * 100)
}

function formatCost(cents: number | null) {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function MaintenanceSection({ vehicleId, userId }: MaintenanceSectionProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [performedOn, setPerformedOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [mileage, setMileage] = useState('')
  const [costDollars, setCostDollars] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [notes, setNotes] = useState('')

  async function refreshRecords() {
    const rows = await listMaintenanceForVehicle(vehicleId)
    setRecords(rows)
  }

  useEffect(() => {
    let isMounted = true
    listMaintenanceForVehicle(vehicleId)
      .then((rows) => {
        if (isMounted) setRecords(rows)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load maintenance')
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
    setFormError(null)
    setIsSaving(true)

    const draft: MaintenanceDraft = {
      vehicle_id: vehicleId,
      title,
      performed_on: performedOn,
      mileage: mileage.trim() === '' ? null : Number(mileage),
      cost_cents: dollarsToCents(costDollars),
      performed_by: performedBy.trim() || null,
      notes: notes.trim() || null,
    }

    try {
      await createMaintenanceRecord(userId, draft)
      setTitle('')
      setMileage('')
      setCostDollars('')
      setPerformedBy('')
      setNotes('')
      await refreshRecords()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save maintenance')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(recordId: string) {
    const confirmed = window.confirm('Delete this maintenance record?')
    if (!confirmed) return
    await deleteMaintenanceRecord(recordId)
    await refreshRecords()
  }

  return (
    <section className="stack-section">
      <h2>Maintenance</h2>
      {isLoading ? <p className="muted">Loading history…</p> : null}
      {loadError ? <p className="form-error">{loadError}</p> : null}

      <ul className="plain-list">
        {records.map((record) => (
          <li key={record.id} className="history-item">
            <div>
              <strong>{record.title}</strong>
              <p className="muted">
                {record.performed_on}
                {record.mileage != null ? ` · ${record.mileage.toLocaleString()} mi` : ''}
                {` · ${formatCost(record.cost_cents)}`}
                {record.performed_by ? ` · ${record.performed_by}` : ''}
              </p>
              {record.notes ? <p>{record.notes}</p> : null}
            </div>
            <button type="button" className="button-danger" onClick={() => void handleDelete(record.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      {records.length === 0 && !isLoading && !loadError ? (
        <p className="muted">No maintenance logged for this vehicle yet.</p>
      ) : null}

      <h3>Log work</h3>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <div className="form-grid">
          <label>
            Date
            <input
              type="date"
              value={performedOn}
              onChange={(event) => setPerformedOn(event.target.value)}
              required
            />
          </label>
          <label>
            Mileage
            <input type="number" value={mileage} onChange={(event) => setMileage(event.target.value)} />
          </label>
          <label>
            Cost (USD)
            <input
              type="number"
              step="0.01"
              value={costDollars}
              onChange={(event) => setCostDollars(event.target.value)}
            />
          </label>
        </div>
        <label>
          Shop / DIY
          <input value={performedBy} onChange={(event) => setPerformedBy(event.target.value)} />
        </label>
        <label>
          Notes
          <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        {formError ? <p className="form-error">{formError}</p> : null}
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Add maintenance'}
        </button>
      </form>
    </section>
  )
}
