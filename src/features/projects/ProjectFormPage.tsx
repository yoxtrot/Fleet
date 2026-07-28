import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

function parseOptionalPositiveInteger(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function ProjectFormPage() {
  const { vehicleId, projectId } = useParams()
  const isEditing = Boolean(projectId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [partLinksText, setPartLinksText] = useState('')
  const [maintenanceDescription, setMaintenanceDescription] = useState('')
  const [mileageInterval, setMileageInterval] = useState('')
  const [timeIntervalMonths, setTimeIntervalMonths] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

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
        setTitle(project.title)
        setDescription(project.description ?? '')
        setPartLinksText(formatPartLinksText(project.part_links))
        setMaintenanceDescription(project.maintenance_description ?? '')
        setMileageInterval(
          project.maintenance_mileage_interval_miles != null
            ? String(project.maintenance_mileage_interval_miles)
            : '',
        )
        if (project.maintenance_time_interval_days != null) {
          const months = daysToMonths(project.maintenance_time_interval_days)
          setTimeIntervalMonths(
            months != null
              ? String(months)
              : String(Math.round(project.maintenance_time_interval_days / 30)),
          )
        } else {
          setTimeIntervalMonths('')
        }
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user || !vehicleId) return
    setFormError(null)

    const mileageIntervalMiles = parseOptionalPositiveInteger(mileageInterval)
    const months = parseOptionalPositiveInteger(timeIntervalMonths)
    const timeIntervalDays = months != null ? monthsToDays(months) : null
    const trimmedMaintenanceDescription = maintenanceDescription.trim()

    const hasAnyMaintenanceField =
      trimmedMaintenanceDescription !== '' ||
      mileageInterval.trim() !== '' ||
      timeIntervalMonths.trim() !== ''

    if (hasAnyMaintenanceField) {
      if (!trimmedMaintenanceDescription) {
        setFormError('Add a maintenance description, or clear the maintenance interval fields.')
        return
      }
      if (mileageIntervalMiles == null && timeIntervalDays == null) {
        setFormError('Set a mileage interval, a time interval (months), or both for maintenance.')
        return
      }
      if (mileageInterval.trim() !== '' && mileageIntervalMiles == null) {
        setFormError('Mileage interval must be a positive whole number.')
        return
      }
      if (timeIntervalMonths.trim() !== '' && months == null) {
        setFormError('Time interval must be a positive whole number of months.')
        return
      }
    }

    setIsSaving(true)

    try {
      const partLinks = parsePartLinksText(partLinksText)
      const draft = {
        title,
        description: description.trim() || null,
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

      navigate(`/vehicles/${vehicleId}/projects/${saved.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save project')
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageLoadingState label="Loading project…" />

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">{isEditing ? 'Edit project' : 'Add project'}</Typography>
        <Button
          component={RouterLink}
          to={
            isEditing && vehicleId && projectId
              ? `/vehicles/${vehicleId}/projects/${projectId}`
              : `/vehicles/${vehicleId}`
          }
          variant="text"
        >
          Cancel
        </Button>
      </Stack>

      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <TextField
          label="Description"
          multiline
          minRows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextField
          label="Parts links"
          helperText="One URL per line for parts you’ll need."
          multiline
          minRows={3}
          value={partLinksText}
          onChange={(event) => setPartLinksText(event.target.value)}
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
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      onClick={() =>
                        setSelectedImages((current) => current.filter((_, fileIndex) => fileIndex !== index))
                      }
                    >
                      Remove
                    </Button>
                  </Box>
                )
              })}
            </Box>
          ) : null}
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
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="h3">Maintenance interval</Typography>
          <Typography variant="body2" color="text.secondary">
            Optional. Associate recurring service with this project (mileage, months, or both).
          </Typography>
        </Stack>
        <TextField
          label="Maintenance description"
          value={maintenanceDescription}
          onChange={(event) => setMaintenanceDescription(event.target.value)}
          placeholder="Oil change, tire rotation…"
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Mileage interval"
              type="number"
              value={mileageInterval}
              onChange={(event) => setMileageInterval(event.target.value)}
              helperText="Miles between services. Example: 5000"
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Time interval"
              type="number"
              value={timeIntervalMonths}
              onChange={(event) => setTimeIntervalMonths(event.target.value)}
              helperText="Months between services. Example: 6"
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Grid>
        </Grid>

        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save project'}
        </Button>
      </Stack>
    </PagePanel>
  )
}
