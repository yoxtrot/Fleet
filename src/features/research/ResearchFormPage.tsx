import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
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
import { ClickToEditField } from '../../shared/ClickToEditField'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'
import { snapshotsDiffer, useSaveOnExit } from '../../shared/useSaveOnExit'

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

type ResearchFormSnapshot = {
  draft: ResearchDraft
  tagsInput: string
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
  const { user, isDemoMode } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [snapshot, setSnapshot] = useState<ResearchFormSnapshot>(() => ({
    draft: {
      ...emptyDraft,
      vehicle_id: searchParams.get('vehicleId'),
    },
    tagsInput: '',
  }))
  const [baseline, setBaseline] = useState<ResearchFormSnapshot>(() => ({
    draft: {
      ...emptyDraft,
      vehicle_id: searchParams.get('vehicleId'),
    },
    tagsInput: '',
  }))
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const savedIdRef = useRef<string | null>(noteId ?? null)

  const isDirty = !isDemoMode && snapshotsDiffer(snapshot, baseline)

  const persist = useCallback(async () => {
    if (!user || isDemoMode) return true
    setFormError(null)

    if (!snapshot.draft.title.trim()) {
      setFormError('Title is required.')
      return false
    }

    const payload: ResearchDraft = {
      ...snapshot.draft,
      title: snapshot.draft.title.trim(),
      tags: parseTags(snapshot.tagsInput),
    }

    try {
      const saved =
        isEditing && noteId
          ? await updateResearchNote(noteId, payload)
          : await createResearchNote(user.id, payload)

      savedIdRef.current = saved.id
      const nextBaseline: ResearchFormSnapshot = {
        draft: {
          vehicle_id: saved.vehicle_id,
          maintenance_record_id: saved.maintenance_record_id,
          title: saved.title,
          symptom: saved.symptom,
          diagnosis: saved.diagnosis,
          steps_tried: saved.steps_tried,
          parts_list: saved.parts_list,
          external_links: saved.external_links,
          tags: saved.tags,
        },
        tagsInput: saved.tags.join(', '),
      }
      setSnapshot(nextBaseline)
      setBaseline(nextBaseline)
      return true
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save research note')
      return false
    }
  }, [user, isDemoMode, snapshot, isEditing, noteId])

  const { isSaving, exitAndSave } = useSaveOnExit({
    isDirty,
    onSave: persist,
  })

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
          const next: ResearchFormSnapshot = {
            draft: {
              vehicle_id: note.vehicle_id,
              maintenance_record_id: note.maintenance_record_id,
              title: note.title,
              symptom: note.symptom,
              diagnosis: note.diagnosis,
              steps_tried: note.steps_tried,
              parts_list: note.parts_list,
              external_links: note.external_links,
              tags: note.tags,
            },
            tagsInput: note.tags.join(', '),
          }
          savedIdRef.current = note.id
          setSnapshot(next)
          setBaseline(next)
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

  function discardChanges() {
    setSnapshot(baseline)
    setFormError(null)
  }

  function donePath() {
    const id = savedIdRef.current ?? noteId
    if (id) return `/research/${id}`
    return '/research'
  }

  if (isLoading) return <PageLoadingState label="Loading form…" />

  return (
    <PagePanel>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Typography variant="h1">{isEditing ? 'Edit research note' : 'New research note'}</Typography>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {!isDemoMode ? (
            <Button variant="outlined" color="inherit" disabled={!isDirty || isSaving} onClick={discardChanges}>
              Discard changes
            </Button>
          ) : null}
          <Button variant="text" disabled={isSaving} onClick={() => void exitAndSave(donePath)}>
            {isSaving ? 'Saving…' : 'Done'}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <ClickToEditField
          label="Title"
          value={snapshot.draft.title}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              draft: { ...current.draft, title: event.target.value },
            }))
          }
          required
          locked={isDemoMode}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="research-vehicle-label">Vehicle</InputLabel>
          <Select
            labelId="research-vehicle-label"
            label="Vehicle"
            value={snapshot.draft.vehicle_id ?? ''}
            disabled={isDemoMode}
            onChange={(event) =>
              setSnapshot((current) => ({
                ...current,
                draft: { ...current.draft, vehicle_id: event.target.value || null },
              }))
            }
          >
            <MenuItem value="">No vehicle</MenuItem>
            {vehicles.map((vehicle) => (
              <MenuItem key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ClickToEditField
          label="Symptom"
          multiline
          minRows={3}
          value={snapshot.draft.symptom ?? ''}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              draft: { ...current.draft, symptom: event.target.value || null },
            }))
          }
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Diagnosis"
          multiline
          minRows={3}
          value={snapshot.draft.diagnosis ?? ''}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              draft: { ...current.draft, diagnosis: event.target.value || null },
            }))
          }
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Steps tried"
          multiline
          minRows={5}
          value={snapshot.draft.steps_tried ?? ''}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              draft: { ...current.draft, steps_tried: event.target.value || null },
            }))
          }
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Parts list"
          multiline
          minRows={3}
          value={snapshot.draft.parts_list ?? ''}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              draft: { ...current.draft, parts_list: event.target.value || null },
            }))
          }
          locked={isDemoMode}
        />
        <ClickToEditField
          label="External links"
          multiline
          minRows={3}
          value={snapshot.draft.external_links ?? ''}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              draft: { ...current.draft, external_links: event.target.value || null },
            }))
          }
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Tags (comma-separated)"
          value={snapshot.tagsInput}
          onChange={(event) =>
            setSnapshot((current) => ({
              ...current,
              tagsInput: event.target.value,
            }))
          }
          locked={isDemoMode}
        />
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        {isDirty ? (
          <Typography variant="body2" color="text.secondary">
            Changes save when you leave this page.
          </Typography>
        ) : null}
      </Stack>
    </PagePanel>
  )
}
