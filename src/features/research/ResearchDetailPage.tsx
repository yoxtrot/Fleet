import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteResearchNote, getResearchNoteById } from './researchApi'
import { getVehicleById } from '../vehicles/vehiclesApi'
import type { FixResearchNote } from '../../lib/database.types'

export function ResearchDetailPage() {
  const { noteId } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<FixResearchNote | null>(null)
  const [vehicleNickname, setVehicleNickname] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!noteId) return
    let isMounted = true

    getResearchNoteById(noteId)
      .then(async (row) => {
        if (!isMounted) return
        setNote(row)
        if (row.vehicle_id) {
          const vehicle = await getVehicleById(row.vehicle_id)
          if (isMounted) setVehicleNickname(vehicle.nickname)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load note')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [noteId])

  async function handleDelete() {
    if (!noteId || !note) return
    const confirmed = window.confirm(`Delete research note "${note.title}"?`)
    if (!confirmed) return
    await deleteResearchNote(noteId)
    navigate('/research')
  }

  if (isLoading) return <p className="page-status">Loading note…</p>
  if (loadError || !note || !noteId) {
    return (
      <div className="page">
        <p className="form-error">{loadError ?? 'Note not found'}</p>
        <Link to="/research">Back to research</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <Link to="/research">Research</Link>
          </p>
          <h1>{note.title}</h1>
          <p className="muted">{vehicleNickname ?? 'No linked vehicle'}</p>
        </div>
        <div className="button-row">
          <Link className="button-secondary" to={`/research/${note.id}/edit`}>
            Edit
          </Link>
          <button type="button" className="button-danger" onClick={() => void handleDelete()}>
            Delete
          </button>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Symptom</dt>
          <dd className="preserve-lines">{note.symptom || '—'}</dd>
        </div>
        <div>
          <dt>Diagnosis</dt>
          <dd className="preserve-lines">{note.diagnosis || '—'}</dd>
        </div>
        <div>
          <dt>Steps tried</dt>
          <dd className="preserve-lines">{note.steps_tried || '—'}</dd>
        </div>
        <div>
          <dt>Parts list</dt>
          <dd className="preserve-lines">{note.parts_list || '—'}</dd>
        </div>
        <div>
          <dt>External links</dt>
          <dd className="preserve-lines">{note.external_links || '—'}</dd>
        </div>
        <div>
          <dt>Tags</dt>
          <dd>{note.tags.length > 0 ? note.tags.join(', ') : '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
