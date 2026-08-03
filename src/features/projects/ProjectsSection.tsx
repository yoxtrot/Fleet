import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import {
  formatProjectMaintenanceInterval,
  listProjectsForVehicle,
  PROJECT_STATUS_LABELS,
  projectHasMaintenance,
  resolveProjectImageUrl,
} from './projectsApi'
import type { VehicleProject } from '../../lib/database.types'
import { useAuth } from '../../app/AuthProvider'

type ProjectsSectionProps = {
  vehicleId: string
}

type ProjectListItem = {
  project: VehicleProject
  imageUrls: string[]
}

export function ProjectsSection({ vehicleId }: ProjectsSectionProps) {
  const { isDemoMode } = useAuth()
  const [projectItems, setProjectItems] = useState<ProjectListItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    listProjectsForVehicle(vehicleId)
      .then(async (rows) => {
        const items = await Promise.all(
          rows.map(async (project) => ({
            project,
            imageUrls: (
              await Promise.all(project.image_paths.map((imagePath) => resolveProjectImageUrl(imagePath)))
            ).filter(Boolean),
          })),
        )
        if (isMounted) setProjectItems(items)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load projects')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [vehicleId])

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h2">Projects</Typography>
        {!isDemoMode ? (
          <Button component={RouterLink} to={`/vehicles/${vehicleId}/projects/new`}>
            Add project
          </Button>
        ) : null}
      </Stack>

      {isLoading ? <Typography color="text.secondary">Loading projects…</Typography> : null}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {!isLoading && !loadError && projectItems.length === 0 ? (
        <Typography color="text.secondary">
          No projects yet. Add one for planned work, parts links, and reference photos.
        </Typography>
      ) : null}

      <Stack spacing={1.5}>
        {projectItems.map(({ project, imageUrls }) => (
          <Card key={project.id} variant="outlined">
            <CardActionArea component={RouterLink} to={`/vehicles/${vehicleId}/projects/${project.id}`}>
              <CardContent>
                {imageUrls.length > 0 ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    {imageUrls.map((imageUrl, index) => (
                      <Box
                        key={`${project.id}-image-${index}`}
                        sx={{
                          height: 88,
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={`${project.title} photo ${index + 1}`}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : null}
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{project.title}</Typography>
                  <Chip
                    size="small"
                    color={project.status === 'complete' ? 'success' : project.status === 'pending' ? 'warning' : 'default'}
                    label={PROJECT_STATUS_LABELS[project.status]}
                  />
                </Stack>
                {project.description ? (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                    {project.description}
                  </Typography>
                ) : null}
                <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                  {project.image_paths.length} image{project.image_paths.length === 1 ? '' : 's'}
                  {' · '}
                  {project.part_links.length} part link{project.part_links.length === 1 ? '' : 's'}
                </Typography>
                {projectHasMaintenance(project) ? (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Chip size="small" label={project.maintenance_description ?? 'Maintenance'} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={formatProjectMaintenanceInterval(project)}
                    />
                  </Stack>
                ) : null}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
