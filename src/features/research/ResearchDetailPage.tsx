import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { deleteResearchNote, getResearchNoteById } from './researchApi'
import { getVehicleById } from '../vehicles/vehiclesApi'
import type { FixResearchNote } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function ResearchDetailPage() {
  const { noteId } = useParams()
  const navigate = useNavigate()
  const { isDemoMode } = useAuth()
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

  if (isLoading) return <PageLoadingState label="Loading note…" />

  if (loadError || !note || !noteId) {
    return (
      <PagePanel>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError ?? 'Note not found'}
        </Alert>
        <Button component={RouterLink} to="/research" variant="text">
          Back to research
        </Button>
      </PagePanel>
    )
  }

  const detailFields = [
    { label: 'Symptom', value: note.symptom },
    { label: 'Diagnosis', value: note.diagnosis },
    { label: 'Steps tried', value: note.steps_tried },
    { label: 'Parts list', value: note.parts_list },
    { label: 'External links', value: note.external_links },
    { label: 'Tags', value: note.tags.length > 0 ? note.tags.join(', ') : null },
  ]

  return (
    <PagePanel>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
      >
        <Box>
          <Button component={RouterLink} to="/research" size="small" variant="text" sx={{ px: 0, mb: 1 }}>
            Research
          </Button>
          <Typography variant="h1">{note.title}</Typography>
          <Typography color="text.secondary">{vehicleNickname ?? 'No linked vehicle'}</Typography>
        </Box>
        {!isDemoMode ? (
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to={`/research/${note.id}/edit`} variant="outlined">
              Edit
            </Button>
            <Button color="error" variant="outlined" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </Stack>
        ) : null}
      </Stack>

      <Stack spacing={2} divider={<Divider flexItem />}>
        {detailFields.map((field) => (
          <Box key={field.label}>
            <Typography variant="overline" color="text.secondary">
              {field.label}
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{field.value || '—'}</Typography>
          </Box>
        ))}
      </Stack>
    </PagePanel>
  )
}
