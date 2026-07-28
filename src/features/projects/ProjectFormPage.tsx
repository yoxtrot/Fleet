import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import {
  createProjectForUser,
  formatPartLinksText,
  getProjectById,
  parsePartLinksText,
  updateProject,
  uploadProjectImages,
} from './projectsApi'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function ProjectFormPage() {
  const { vehicleId, projectId } = useParams()
  const isEditing = Boolean(projectId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [partLinksText, setPartLinksText] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!projectId) return
    let isMounted = true

    getProjectById(projectId)
      .then((project) => {
        if (!isMounted) return
        setTitle(project.title)
        setDescription(project.description ?? '')
        setPartLinksText(formatPartLinksText(project.part_links))
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
    setIsSaving(true)
    setFormError(null)

    try {
      const partLinks = parsePartLinksText(partLinksText)
      let saved =
        isEditing && projectId
          ? await updateProject(projectId, {
              title,
              description: description.trim() || null,
              part_links: partLinks,
            })
          : await createProjectForUser(user.id, {
              vehicle_id: vehicleId,
              title,
              description: description.trim() || null,
              part_links: partLinks,
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

        <Stack spacing={1}>
          <Typography variant="subtitle1">Images</Typography>
          <Typography variant="body2" color="text.secondary">
            JPEG, PNG, or WebP up to 5 MB each. You can add more later from the project page.
          </Typography>
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {selectedImages.length > 0
              ? `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`
              : 'Add images'}
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => setSelectedImages(Array.from(event.target.files ?? []))}
            />
          </Button>
          {selectedImages.length > 0 ? (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {selectedImages.map((file) => (
                <Typography component="li" key={`${file.name}-${file.size}`} variant="body2">
                  {file.name}
                </Typography>
              ))}
            </Box>
          ) : null}
        </Stack>

        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save project'}
        </Button>
      </Stack>
    </PagePanel>
  )
}
