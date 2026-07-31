import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, Button, Divider, Grid, Stack, Typography } from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import {
  createProjectForUser,
  daysToMonths,
  formatPartLinksText,
  getProjectById,
  monthsToDays,
  parsePartLinksText,
  updateProject,
  uploadProjectImages,
} from './projectsApi'
import { ClickToEditField } from '../../shared/ClickToEditField'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'
import { snapshotsDiffer, useSaveOnExit } from '../../shared/useSaveOnExit'

type ProjectFormSnapshot = {
  title: string
  description: string
  partLinksText: string
  maintenanceDescription: string
  mileageInterval: string
  timeIntervalMonths: string
}

const emptySnapshot: ProjectFormSnapshot = {
  title: '',
  description: '',
  partLinksText: '',
  maintenanceDescription: '',
  mileageInterval: '',
  timeIntervalMonths: '',
}

function parseOptionalPositiveInteger(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function ProjectFormPage() {
  const { vehicleId, projectId } = useParams()
  const isEditing = Boolean(projectId)
  const { user, isDemoMode } = useAuth()
  const [form, setForm] = useState<ProjectFormSnapshot>(emptySnapshot)
  const [baseline, setBaseline] = useState<ProjectFormSnapshot>(emptySnapshot)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const savedIdRef = useRef<string | null>(projectId ?? null)

  const isDirty =
    !isDemoMode && (snapshotsDiffer(form, baseline) || selectedImages.length > 0)

  const persist = useCallback(async () => {
    if (!user || !vehicleId || isDemoMode) return true
    setFormError(null)

    if (!form.title.trim()) {
      setFormError('Title is required.')
      return false
    }

    const mileageIntervalMiles = parseOptionalPositiveInteger(form.mileageInterval)
    const months = parseOptionalPositiveInteger(form.timeIntervalMonths)
    const timeIntervalDays = months != null ? monthsToDays(months) : null
    const trimmedMaintenanceDescription = form.maintenanceDescription.trim()

    const hasAnyMaintenanceField =
      trimmedMaintenanceDescription !== '' ||
      form.mileageInterval.trim() !== '' ||
      form.timeIntervalMonths.trim() !== ''

    if (hasAnyMaintenanceField) {
      if (!trimmedMaintenanceDescription) {
        setFormError('Add a maintenance description, or clear the maintenance interval fields.')
        return false
      }
      if (mileageIntervalMiles == null && timeIntervalDays == null) {
        setFormError('Set a mileage interval, a time interval (months), or both for maintenance.')
        return false
      }
      if (form.mileageInterval.trim() !== '' && mileageIntervalMiles == null) {
        setFormError('Mileage interval must be a positive whole number.')
        return false
      }
      if (form.timeIntervalMonths.trim() !== '' && months == null) {
        setFormError('Time interval must be a positive whole number of months.')
        return false
      }
    }

    try {
      const partLinks = parsePartLinksText(form.partLinksText)
      const draft = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        part_links: partLinks,
        maintenance_description: hasAnyMaintenanceField ? trimmedMaintenanceDescription : null,
        maintenance_mileage_interval_miles: hasAnyMaintenanceField ? mileageIntervalMiles : null,
        maintenance_time_interval_days: hasAnyMaintenanceField ? timeIntervalDays : null,
      }

      let saved =
        isEditing && projectId
          ? await updateProject(projectId, draft)
          : await createProjectForUser(user.id, {
              vehicle_id: vehicleId,
              ...draft,
            })

      if (selectedImages.length > 0) {
        saved = await uploadProjectImages(user.id, saved, selectedImages)
      }

      savedIdRef.current = saved.id
      setBaseline(form)
      setSelectedImages([])
      return true
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save project')
      return false
    }
  }, [user, vehicleId, isDemoMode, form, isEditing, projectId, selectedImages])

  const { isSaving, exitAndSave } = useSaveOnExit({
    isDirty,
    onSave: persist,
  })

  useEffect(() => {
    const urls = selectedImages.map((file) => URL.createObjectURL(file))
    setImagePreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedImages])

  useEffect(() => {
    if (!projectId) return
    let isMounted = true

    getProjectById(projectId)
      .then((project) => {
        if (!isMounted) return
        const next: ProjectFormSnapshot = {
          title: project.title,
          description: project.description ?? '',
          partLinksText: formatPartLinksText(project.part_links),
          maintenanceDescription: project.maintenance_description ?? '',
          mileageInterval:
            project.maintenance_mileage_interval_miles != null
              ? String(project.maintenance_mileage_interval_miles)
              : '',
          timeIntervalMonths: '',
        }
        if (project.maintenance_time_interval_days != null) {
          const months = daysToMonths(project.maintenance_time_interval_days)
          next.timeIntervalMonths =
            months != null
              ? String(months)
              : String(Math.round(project.maintenance_time_interval_days / 30))
        }
        savedIdRef.current = project.id
        setForm(next)
        setBaseline(next)
        setSelectedImages([])
      })
      .catch((error: unknown) => {
        if (isMounted) setFormError(error instanceof Error ? error.message : 'Failed to load project')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [projectId])

  function discardChanges() {
    setForm(baseline)
    setSelectedImages([])
    setFormError(null)
  }

  function donePath() {
    const id = savedIdRef.current ?? projectId
    if (vehicleId && id) return `/vehicles/${vehicleId}/projects/${id}`
    if (vehicleId) return `/vehicles/${vehicleId}`
    return '/vehicles'
  }

  function patchForm(patch: Partial<ProjectFormSnapshot>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  if (isLoading) return <PageLoadingState label="Loading project…" />

  return (
    <PagePanel>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Typography variant="h1">{isEditing ? 'Edit project' : 'Add project'}</Typography>
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
          value={form.title}
          onChange={(event) => patchForm({ title: event.target.value })}
          required
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Description"
          multiline
          minRows={4}
          value={form.description}
          onChange={(event) => patchForm({ description: event.target.value })}
          locked={isDemoMode}
        />
        <ClickToEditField
          label="Parts links"
          helperText="One URL per line for parts you’ll need."
          multiline
          minRows={3}
          value={form.partLinksText}
          onChange={(event) => patchForm({ partLinksText: event.target.value })}
          locked={isDemoMode}
        />

        <Stack spacing={1.5}>
          <Typography variant="subtitle1">Images</Typography>
          <Typography variant="body2" color="text.secondary">
            JPEG, PNG, or WebP up to 5 MB each. You can add more later from the project page.
          </Typography>
          {imagePreviewUrls.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              {imagePreviewUrls.map((previewUrl, index) => {
                const file = selectedImages[index]
                return (
                  <Box key={`${file?.name ?? 'image'}-${file?.size ?? index}-${file?.lastModified ?? index}`}>
                    <Box
                      component="img"
                      src={previewUrl}
                      alt={file?.name ?? `Selected image ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        display: 'block',
                      }}
                    />
                    {!isDemoMode ? (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ mt: 1 }}
                        onClick={() =>
                          setSelectedImages((current) =>
                            current.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Box>
                )
              })}
            </Box>
          ) : null}
          {!isDemoMode ? (
            <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              {selectedImages.length > 0
                ? `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`
                : 'Add images'}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  setSelectedImages(Array.from(event.target.files ?? []))
                  event.target.value = ''
                }}
              />
            </Button>
          ) : null}
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="h3">Maintenance interval</Typography>
          <Typography variant="body2" color="text.secondary">
            Optional. Associate recurring service with this project (mileage, months, or both).
          </Typography>
        </Stack>
        <ClickToEditField
          label="Maintenance description"
          value={form.maintenanceDescription}
          onChange={(event) => patchForm({ maintenanceDescription: event.target.value })}
          placeholder="Oil change, tire rotation…"
          locked={isDemoMode}
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ClickToEditField
              label="Mileage interval"
              type="number"
              value={form.mileageInterval}
              onChange={(event) => patchForm({ mileageInterval: event.target.value })}
              helperText="Miles between services. Example: 5000"
              slotProps={{ htmlInput: { min: 1 } }}
              locked={isDemoMode}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ClickToEditField
              label="Time interval"
              type="number"
              value={form.timeIntervalMonths}
              onChange={(event) => patchForm({ timeIntervalMonths: event.target.value })}
              helperText="Months between services. Example: 6"
              slotProps={{ htmlInput: { min: 1 } }}
              locked={isDemoMode}
            />
          </Grid>
        </Grid>

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
