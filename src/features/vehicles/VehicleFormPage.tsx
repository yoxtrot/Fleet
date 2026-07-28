import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import {
  clearVehiclePhoto,
  createVehicleForUser,
  getVehicleById,
  resolveVehiclePhotoUrl,
  updateVehicle,
  uploadVehiclePhoto,
  type VehicleDraft,
} from './vehiclesApi'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

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
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!vehicleId) return
    let isMounted = true

    getVehicleById(vehicleId)
      .then(async (vehicle) => {
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
        setExistingPhotoPath(vehicle.photo_path)
        setExistingPhotoUrl(await resolveVehiclePhotoUrl(vehicle.photo_path))
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

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedPhoto)
    setPhotoPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedPhoto])

  function handlePhotoChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null
    setSelectedPhoto(file)
    if (file) setRemoveExistingPhoto(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setIsSaving(true)
    setFormError(null)

    try {
      let saved =
        isEditing && vehicleId
          ? await updateVehicle(vehicleId, draft)
          : await createVehicleForUser(user.id, draft)

      if (selectedPhoto) {
        saved = await uploadVehiclePhoto(user.id, saved.id, selectedPhoto)
      } else if (removeExistingPhoto && saved.photo_path) {
        saved = await clearVehiclePhoto(saved)
      }

      navigate(`/vehicles/${saved.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save vehicle')
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageLoadingState label="Loading vehicle…" />

  const previewUrl = photoPreviewUrl ?? (!removeExistingPhoto ? existingPhotoUrl : null)

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">{isEditing ? 'Edit vehicle' : 'Add vehicle'}</Typography>
        <Button
          component={RouterLink}
          to={isEditing && vehicleId ? `/vehicles/${vehicleId}` : '/vehicles'}
          variant="text"
        >
          Cancel
        </Button>
      </Stack>

      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="Nickname"
          value={draft.nickname}
          onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
          required
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Year"
              type="number"
              value={draft.year ?? ''}
              onChange={(event) => setDraft({ ...draft, year: parseOptionalNumber(event.target.value) })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Make"
              value={draft.make}
              onChange={(event) => setDraft({ ...draft, make: event.target.value })}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Model"
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              required
            />
          </Grid>
        </Grid>
        <TextField
          label="VIN"
          value={draft.vin ?? ''}
          onChange={(event) => setDraft({ ...draft, vin: event.target.value || null })}
        />
        <TextField
          label="Current mileage"
          type="number"
          value={draft.current_mileage ?? ''}
          onChange={(event) =>
            setDraft({ ...draft, current_mileage: parseOptionalNumber(event.target.value) })
          }
        />
        <TextField
          label="Notes"
          multiline
          minRows={4}
          value={draft.notes ?? ''}
          onChange={(event) => setDraft({ ...draft, notes: event.target.value || null })}
        />

        <Stack spacing={1.5}>
          <Typography variant="subtitle1">Photo</Typography>
          <Typography variant="body2" color="text.secondary">
            JPEG, PNG, or WebP up to 5 MB.
          </Typography>
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Vehicle preview"
              sx={{
                width: '100%',
                maxWidth: 420,
                maxHeight: 240,
                objectFit: 'cover',
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            />
          ) : null}
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {previewUrl ? 'Change photo' : 'Add photo'}
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handlePhotoChange(event.target.files)}
            />
          </Button>
          {existingPhotoPath && !selectedPhoto ? (
            <FormControlLabel
              control={
                <Switch
                  checked={removeExistingPhoto}
                  onChange={(event) => setRemoveExistingPhoto(event.target.checked)}
                />
              }
              label="Remove current photo"
            />
          ) : null}
        </Stack>

        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save vehicle'}
        </Button>
      </Stack>
    </PagePanel>
  )
}
