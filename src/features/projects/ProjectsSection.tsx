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
import { formatProjectMaintenanceInterval, listProjectsForVehicle, projectHasMaintenance } from './projectsApi'
import type { VehicleProject } from '../../lib/database.types'

type ProjectsSectionProps = {
  vehicleId: string
}

export function ProjectsSection({ vehicleId }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<VehicleProject[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    listProjectsForVehicle(vehicleId)
      .then((rows) => {
        if (isMounted) setProjects(rows)
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
        <Button component={RouterLink} to={`/vehicles/${vehicleId}/projects/new`}>
          Add project
        </Button>
      </Stack>

      {isLoading ? <Typography color="text.secondary">Loading projects…</Typography> : null}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {!isLoading && !loadError && projects.length === 0 ? (
        <Typography color="text.secondary">
          No projects yet. Add one for planned work, parts links, and reference photos.
        </Typography>
      ) : null}

      <Stack spacing={1.5}>
        {projects.map((project) => (
          <Card key={project.id} variant="outlined">
            <CardActionArea component={RouterLink} to={`/vehicles/${vehicleId}/projects/${project.id}`}>
              <CardContent>
                <Typography sx={{ fontWeight: 700 }}>{project.title}</Typography>
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
