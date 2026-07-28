import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { deleteVehicle, getVehicleById } from './vehiclesApi'
import { VehiclePhoto } from './VehiclePhoto'
import { ProjectsSection } from '../projects/ProjectsSection'
import type { Vehicle } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return
    let isMounted = true

    getVehicleById(vehicleId)
      .then((row) => {
        if (isMounted) setVehicle(row)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load vehicle')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [vehicleId])

  async function handleDelete() {
    if (!vehicleId || !vehicle) return
    const confirmed = window.confirm(
      `Delete ${vehicle.nickname}? This also removes its projects.`,
    )
    if (!confirmed) return
    await deleteVehicle(vehicleId)
    navigate('/vehicles')
  }

  if (isLoading) return <PageLoadingState label="Loading vehicle…" />

  if (loadError || !vehicle || !vehicleId || !user) {
    return (
      <PagePanel>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError ?? 'Vehicle not found'}
        </Alert>
        <Button component={RouterLink} to="/vehicles" variant="text">
          Back to vehicles
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
          <Button component={RouterLink} to="/vehicles" size="small" variant="text" sx={{ px: 0, mb: 1 }}>
            Vehicles
          </Button>
          <Typography variant="h1">{vehicle.nickname}</Typography>
          <Typography color="text.secondary">
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to={`/vehicles/${vehicle.id}/edit`} variant="outlined">
            Edit
          </Button>
          <Button color="error" variant="outlined" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </Stack>
      </Stack>

      {vehicle.photo_path ? (
        <Box sx={{ mb: 3 }}>
          <VehiclePhoto photoPath={vehicle.photo_path} nickname={vehicle.nickname} height={280} />
        </Box>
      ) : null}

      <Stack spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            VIN
          </Typography>
          <Typography>{vehicle.vin || '—'}</Typography>
        </Box>
        <Divider />
        <Box>
          <Typography variant="overline" color="text.secondary">
            Mileage
          </Typography>
          <Typography>
            {vehicle.current_mileage != null ? `${vehicle.current_mileage.toLocaleString()} mi` : '—'}
          </Typography>
        </Box>
        <Divider />
        <Box>
          <Typography variant="overline" color="text.secondary">
            Notes
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{vehicle.notes || '—'}</Typography>
        </Box>
      </Stack>

      <ProjectsSection vehicleId={vehicleId} />
    </PagePanel>
  )
}
