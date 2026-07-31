import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
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
import { VehiclePhotoCropDialog } from './VehiclePhotoCropDialog'
import { ClickToEditField } from '../../shared/ClickToEditField'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'
import { snapshotsDiffer, useSaveOnExit } from '../../shared/useSaveOnExit'

const emptyDraft: VehicleDraft = {
  nickname: '',
  year: null,
  make: '',
  model: '',
  vin: null,
  current_mileage: null,
  notes: null,
}

type PhotoState = {
  selectedPhoto: File | null
  removeExistingPhoto: boolean
}

const emptyPhotoState: PhotoState = {
  selectedPhoto: null,
  removeExistingPhoto: false,
}

function parseOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function VehicleFormPage() {
  const { vehicleId } = useParams()
  const isEditing = Boolean(vehicleId)
  const { user, isDemoMode } = useAuth()
  const [draft, setDraft] = useState<VehicleDraft>(emptyDraft)
  const [baseline, setBaseline] = useState<VehicleDraft>(emptyDraft)
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [photoState, setPhotoState] = useState<PhotoState>(emptyPhotoState)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const savedIdRef = useRef<string | null>(vehicleId ?? null)
  const cropObjectUrlRef = useRef<string | null>(null)

  const isDirty =
    !isDemoMode &&
    (snapshotsDiffer(draft, baseline) ||
      photoState.selectedPhoto != null ||
      photoState.removeExistingPhoto)

  const persist = useCallback(async () => {
    if (!user || isDemoMode) return true
    setFormError(null)

    if (!draft.nickname.trim() || !draft.make.trim() || !draft.model.trim()) {
      setFormError('Nickname, make, and model are required.')
      return false
    }

    try {
      let saved =
        isEditing && vehicleId
          ? await updateVehicle(vehicleId, draft)
          : await createVehicleForUser(user.id, draft)

      if (photoState.selectedPhoto) {
        saved = await uploadVehiclePhoto(user.id, saved.id, photoState.selectedPhoto)
      } else if (photoState.removeExistingPhoto && saved.photo_path) {
        saved = await clearVehiclePhoto(saved)
      }

      savedIdRef.current = saved.id
      setBaseline(draft)
      setPhotoState(emptyPhotoState)
      setExistingPhotoPath(saved.photo_path)
      setExistingPhotoUrl(await resolveVehiclePhotoUrl(saved.photo_path))
      return true
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save vehicle')
      return false
    }
  }, [user, isDemoMode, draft, isEditing, vehicleId, photoState])

  const { isSaving, exitAndSave } = useSaveOnExit({
    isDirty,
    onSave: persist,
  })

  useEffect(() => {
    if (!vehicleId) return
    let isMounted = true

    getVehicleById(vehicleId)
      .then(async (vehicle) => {
        if (!isMounted) return
        const next: VehicleDraft = {
          nickname: vehicle.nickname,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          vin: vehicle.vin,
          current_mileage: vehicle.current_mileage,
          notes: vehicle.notes,
        }
        savedIdRef.current = vehicle.id
        setDraft(next)
        setBaseline(next)
        setExistingPhotoPath(vehicle.photo_path)
        setExistingPhotoUrl(await resolveVehiclePhotoUrl(vehicle.photo_path))
        setPhotoState(emptyPhotoState)
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
    if (!photoState.selectedPhoto) {
      setPhotoPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(photoState.selectedPhoto)
    setPhotoPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photoState.selectedPhoto])

  function discardChanges() {
    setDraft(baseline)
    setPhotoState(emptyPhotoState)
    setFormError(null)
  }

  function revokeCropObjectUrl() {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current)
      cropObjectUrlRef.current = null
    }
  }

  function openCropper(imageSrc: string, isObjectUrl: boolean) {
    revokeCropObjectUrl()
    if (isObjectUrl) cropObjectUrlRef.current = imageSrc
    setCropSourceUrl(imageSrc)
  }

  function closeCropper() {
    revokeCropObjectUrl()
    setCropSourceUrl(null)
  }

  function handlePhotoChange(fileList: FileList | null) {
    if (isDemoMode) return
    const file = fileList?.[0] ?? null
    if (!file) return
    openCropper(URL.createObjectURL(file), true)
  }

  function handleCropComplete(file: File) {
    setPhotoState({
      selectedPhoto: file,
      removeExistingPhoto: false,
    })
    closeCropper()
  }

  function handleAdjustExistingPhoto() {
    if (isDemoMode || !existingPhotoUrl) return
    void (async () => {
      try {
        const response = await fetch(existingPhotoUrl)
        if (!response.ok) throw new Error('Failed to load photo for cropping')
        const blob = await response.blob()
        openCropper(URL.createObjectURL(blob), true)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Failed to load photo for cropping')
      }
    })()
  }

  function handleAdjustCrop() {
    if (photoPreviewUrl) {
      openCropper(photoPreviewUrl, false)
      return
    }
    handleAdjustExistingPhoto()
  }

  useEffect(() => {
    return () => {
      revokeCropObjectUrl()
    }
  }, [])

  function donePath() {
    const id = savedIdRef.current ?? vehicleId
    if (id) return `/vehicles/${id}`
    return '/vehicles'
  }

  if (isLoading) return <PageLoadingState label="Loading vehicle…" />

  const previewUrl =
    photoPreviewUrl ?? (!photoState.removeExistingPhoto ? existingPhotoUrl : null)

  return (
    <PagePanel>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Typography variant="h1">{isEditing ? 'Edit vehicle' : 'Add vehicle'}</Typography>
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
          label="Nickname"
          value={draft.nickname}
          onChange={(event) => setDraft({ ...draft, nickname: event.target.value })}
          required
          locked={isDemoMode}
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ClickToEditField
              label="Year"
              type="number"
              value={draft.year ?? ''}
              onChange={(event) => setDraft({ ...draft, year: parseOptionalNumber(event.target.value) })}
              locked={isDemoMode}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ClickToEditField
              label="Make"
              value={draft.make}
              onChange={(event) => setDraft({ ...draft, make: event.target.value })}
              required
              locked={isDemoMode}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ClickToEditField
              label="Model"
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              required
              locked={isDemoMode}
            />
          </Grid>
        </Grid>
        <ClickToEditField
          label="VIN"
          value={draft.vin ?? ''}
          onChange={(event) => setDraft({ ...draft, vin: event.target.value || null })}
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Current mileage"
          type="number"
          value={draft.current_mileage ?? ''}
          onChange={(event) =>
            setDraft({ ...draft, current_mileage: parseOptionalNumber(event.target.value) })
          }
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Notes"
          multiline
          minRows={4}
          value={draft.notes ?? ''}
          onChange={(event) => setDraft({ ...draft, notes: event.target.value || null })}
          locked={isDemoMode}
        />

        <Stack spacing={1.5}>
          <Typography variant="subtitle1">Photo</Typography>
          <Typography variant="body2" color="text.secondary">
            JPEG, PNG, or WebP up to 5 MB. After choosing a file, pan and zoom to frame the shot.
          </Typography>
          {previewUrl ? (
            <Box
              sx={{
                width: '100%',
                maxWidth: 420,
                maxHeight: 280,
                borderRadius: 1,
                bgcolor: 'action.hover',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={previewUrl}
                alt="Vehicle preview"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 280,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Box>
          ) : null}
          {!isDemoMode ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Button component="label" variant="outlined">
                {previewUrl ? 'Change photo' : 'Add photo'}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    handlePhotoChange(event.target.files)
                    event.target.value = ''
                  }}
                />
              </Button>
              {previewUrl && !photoState.removeExistingPhoto ? (
                <Button variant="outlined" onClick={handleAdjustCrop}>
                  Adjust crop
                </Button>
              ) : null}
            </Stack>
          ) : null}
          {!isDemoMode && existingPhotoPath && !photoState.selectedPhoto ? (
            <FormControlLabel
              control={
                <Switch
                  checked={photoState.removeExistingPhoto}
                  onChange={(event) =>
                    setPhotoState((current) => ({
                      ...current,
                      removeExistingPhoto: event.target.checked,
                    }))
                  }
                />
              }
              label="Remove current photo"
            />
          ) : null}
        </Stack>

        {formError ? <Alert severity="error">{formError}</Alert> : null}
        {isDirty ? (
          <Typography variant="body2" color="text.secondary">
            Changes save when you leave this page.
          </Typography>
        ) : null}
      </Stack>

      <VehiclePhotoCropDialog
        open={Boolean(cropSourceUrl)}
        imageSrc={cropSourceUrl}
        onCancel={closeCropper}
        onComplete={handleCropComplete}
      />
    </PagePanel>
  )
}
