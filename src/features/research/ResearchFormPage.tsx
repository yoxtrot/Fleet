import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from '../vehicles/vehiclesApi'
import {
  createResearchNote,
  getResearchNoteById,
  updateResearchNote,
  type ResearchDraft,
} from './researchApi'
import type { Vehicle } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

const emptyDraft: ResearchDraft = {
  vehicle_id: null,
  maintenance_record_id: null,
  title: '',
  symptom: null,
  diagnosis: null,
  steps_tried: null,
  parts_list: null,
  external_links: null,
  tags: [],
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function ResearchFormPage() {
  const { noteId } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(noteId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [draft, setDraft] = useState<ResearchDraft>({
    ...emptyDraft,
    vehicle_id: searchParams.get('vehicleId'),
  })
  const [tagsInput, setTagsInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    async function loadForm() {
      try {
        const vehicleRows = await listVehiclesForUser(user!.id)
        if (!isMounted) return
        setVehicles(vehicleRows)

        if (noteId) {
          const note = await getResearchNoteById(noteId)
          if (!isMounted) return
          setDraft({
            vehicle_id: note.vehicle_id,
            maintenance_record_id: note.maintenance_record_id,
            title: note.title,
            symptom: note.symptom,
            diagnosis: note.diagnosis,
            steps_tried: note.steps_tried,
            parts_list: note.parts_list,
            external_links: note.external_links,
            tags: note.tags,
          })
          setTagsInput(note.tags.join(', '))
        }
      } catch (error) {
        if (isMounted) setFormError(error instanceof Error ? error.message : 'Failed to load form')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadForm()
    return () => {
      isMounted = false
    }
  }, [user, noteId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setIsSaving(true)
    setFormError(null)

    const payload: ResearchDraft = {
      ...draft,
      tags: parseTags(tagsInput),
    }

    try {
      const saved =
        isEditing && noteId
          ? await updateResearchNote(noteId, payload)
          : await createResearchNote(user.id, payload)
      navigate(`/research/${saved.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save research note')
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageLoadingState label="Loading form…" />

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">{isEditing ? 'Edit research note' : 'New research note'}</Typography>
        <Button
          component={RouterLink}
          to={isEditing && noteId ? `/research/${noteId}` : '/research'}
          variant="text"
        >
          Cancel
        </Button>
      </Stack>

      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="Title"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          required
        />
        <FormControl fullWidth size="small">
          <InputLabel id="research-vehicle-label">Vehicle</InputLabel>
          <Select
            labelId="research-vehicle-label"
            label="Vehicle"
            value={draft.vehicle_id ?? ''}
            onChange={(event) => setDraft({ ...draft, vehicle_id: event.target.value || null })}
          >
            <MenuItem value="">No vehicle</MenuItem>
            {vehicles.map((vehicle) => (
              <MenuItem key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Symptom"
          multiline
          minRows={3}
          value={draft.symptom ?? ''}
          onChange={(event) => setDraft({ ...draft, symptom: event.target.value || null })}
        />
        <TextField
          label="Diagnosis"
          multiline
          minRows={3}
          value={draft.diagnosis ?? ''}
          onChange={(event) => setDraft({ ...draft, diagnosis: event.target.value || null })}
        />
        <TextField
          label="Steps tried"
          multiline
          minRows={5}
          value={draft.steps_tried ?? ''}
          onChange={(event) => setDraft({ ...draft, steps_tried: event.target.value || null })}
        />
        <TextField
          label="Parts list"
          multiline
          minRows={3}
          value={draft.parts_list ?? ''}
          onChange={(event) => setDraft({ ...draft, parts_list: event.target.value || null })}
        />
        <TextField
          label="External links"
          multiline
          minRows={3}
          value={draft.external_links ?? ''}
          onChange={(event) => setDraft({ ...draft, external_links: event.target.value || null })}
        />
        <TextField
          label="Tags (comma-separated)"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
        />
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save note'}
        </Button>
      </Stack>
    </PagePanel>
  )
}
