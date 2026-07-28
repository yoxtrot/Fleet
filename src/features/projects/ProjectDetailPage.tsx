import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import {
  deleteProject,
  formatMaintenanceTimeInterval,
  getProjectById,
  projectHasMaintenance,
  removeProjectImage,
  resolveProjectImageUrl,
  uploadProjectImages,
} from './projectsApi'
import type { VehicleProject } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function ProjectDetailPage() {
  const { vehicleId, projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState<VehicleProject | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    let isMounted = true

    getProjectById(projectId)
      .then((row) => {
        if (isMounted) setProject(row)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load project')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [projectId])

  useEffect(() => {
    if (!project) return
    let isMounted = true

    Promise.all(
      project.image_paths.map(async (imagePath) => [imagePath, await resolveProjectImageUrl(imagePath)] as const),
    ).then((entries) => {
      if (!isMounted) return
      setImageUrls(Object.fromEntries(entries))
    })

    return () => {
      isMounted = false
    }
  }, [project])

  async function handleDelete() {
    if (!project || !vehicleId) return
    const confirmed = window.confirm(`Delete project “${project.title}”?`)
    if (!confirmed) return
    await deleteProject(project.id)
    navigate(`/vehicles/${vehicleId}`)
  }

  async function handleAddImages(fileList: FileList | null) {
    if (!user || !project || !fileList?.length) return
    setIsUploading(true)
    setActionError(null)
    try {
      const updated = await uploadProjectImages(user.id, project, Array.from(fileList))
      setProject(updated)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemoveImage(imagePath: string) {
    if (!project) return
    const confirmed = window.confirm('Remove this image from the project?')
    if (!confirmed) return
    setActionError(null)
    try {
      const updated = await removeProjectImage(project, imagePath)
      setProject(updated)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to remove image')
    }
  }

  if (isLoading) return <PageLoadingState label="Loading project…" />

  if (loadError || !project || !vehicleId || !projectId) {
    return (
      <PagePanel>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError ?? 'Project not found'}
        </Alert>
        <Button component={RouterLink} to={vehicleId ? `/vehicles/${vehicleId}` : '/vehicles'} variant="text">
          Back
        </Button>
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Button
            component={RouterLink}
            to={`/vehicles/${vehicleId}`}
            size="small"
            variant="text"
            sx={{ px: 0, mb: 1 }}
          >
            Back to vehicle
          </Button>
          <Typography variant="h1">{project.title}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            to={`/vehicles/${vehicleId}/projects/${project.id}/edit`}
            variant="outlined"
          >
            Edit
          </Button>
          <Button color="error" variant="outlined" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </Stack>
      </Stack>

      {actionError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      ) : null}

      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Description
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{project.description || '—'}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Maintenance interval
        </Typography>
        {projectHasMaintenance(project) ? (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>{project.maintenance_description}</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {project.maintenance_mileage_interval_miles != null ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Every ${project.maintenance_mileage_interval_miles.toLocaleString()} mi`}
                />
              ) : null}
              {project.maintenance_time_interval_days != null ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={formatMaintenanceTimeInterval(project.maintenance_time_interval_days)}
                />
              ) : null}
            </Stack>
          </Stack>
        ) : (
          <Typography color="text.secondary">No maintenance interval on this project.</Typography>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h2">Images</Typography>
          <Button component="label" variant="outlined" disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Add images'}
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => {
                void handleAddImages(event.target.files)
                event.target.value = ''
              }}
            />
          </Button>
        </Stack>
        {project.image_paths.length === 0 ? (
          <Typography color="text.secondary">No images yet.</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            {project.image_paths.map((imagePath) => (
              <Box key={imagePath} sx={{ position: 'relative' }}>
                {imageUrls[imagePath] ? (
                  <Box
                    component="img"
                    src={imageUrls[imagePath]}
                    alt={project.title}
                    sx={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Box sx={{ width: '100%', height: 180, borderRadius: 1, bgcolor: 'action.hover' }} />
                )}
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => void handleRemoveImage(imagePath)}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="h2" gutterBottom>
          Parts links
        </Typography>
        {project.part_links.length === 0 ? (
          <Typography color="text.secondary">No parts links yet.</Typography>
        ) : (
          <Stack spacing={1} component="ul" sx={{ m: 0, pl: 2 }}>
            {project.part_links.map((partLink) => (
              <Box component="li" key={partLink}>
                <Link href={partLink} target="_blank" rel="noreferrer">
                  {partLink}
                </Link>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </PagePanel>
  )
}
