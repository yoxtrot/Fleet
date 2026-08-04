import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser, resolveVehiclePhotoUrl } from './vehiclesApi'
import {
  formatVehicleKind,
  VEHICLE_TYPE_SECTION_LABELS,
  VEHICLE_TYPES,
  type VehicleType,
} from './vehicleTypes'
import { VehiclePhotoThumb } from './VehiclePhoto'
import type { Vehicle } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

type VehicleListItem = {
  vehicle: Vehicle
  photoUrl: string | null
}

function VehicleListCard({ vehicle, photoUrl }: VehicleListItem) {
  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} to={`/vehicles/${vehicle.id}`}>
        <Stack direction="row" spacing={2} sx={{ p: 1.5, alignItems: 'center' }}>
          {photoUrl ? <VehiclePhotoThumb src={photoUrl} alt={vehicle.nickname} /> : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{vehicle.nickname}</Typography>
            <Typography color="text.secondary">
              {formatVehicleKind(vehicle.vehicle_type, vehicle.vehicle_subtype)}
              {' · '}
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            </Typography>
            {vehicle.current_mileage != null ? (
              <Typography color="text.secondary" variant="body2">
                {vehicle.current_mileage.toLocaleString()} mi
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  )
}

export function VehicleListPage() {
  const { user, isDemoMode } = useAuth()
  const [vehicleItems, setVehicleItems] = useState<VehicleListItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    listVehiclesForUser(user.id)
      .then(async (rows) => {
        const items = await Promise.all(
          rows.map(async (vehicle) => ({
            vehicle,
            photoUrl: await resolveVehiclePhotoUrl(vehicle.photo_path),
          })),
        )
        if (isMounted) setVehicleItems(items)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load vehicles')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const vehiclesByType = useMemo(() => {
    const groups = Object.fromEntries(
      VEHICLE_TYPES.map((type) => [type, [] as VehicleListItem[]]),
    ) as Record<VehicleType, VehicleListItem[]>

    for (const item of vehicleItems) {
      groups[item.vehicle.vehicle_type].push(item)
    }
    return groups
  }, [vehicleItems])

  if (isLoading) return <PageLoadingState label="Loading vehicles…" />

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">Vehicles</Typography>
        {!isDemoMode ? (
          <Button component={RouterLink} to="/vehicles/new">
            Add vehicle
          </Button>
        ) : null}
      </Stack>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {vehicleItems.length === 0 && !loadError ? (
        <Typography color="text.secondary">Your fleet is empty. Add a vehicle to get started.</Typography>
      ) : (
        <Stack spacing={3}>
          {VEHICLE_TYPES.map((type) => {
            const items = vehiclesByType[type]
            if (items.length === 0) return null
            return (
              <Box key={type} component="section">
                <Typography variant="h2" sx={{ mb: 1.5 }}>
                  {VEHICLE_TYPE_SECTION_LABELS[type]}
                </Typography>
                <Stack spacing={1.5}>
                  {items.map((item) => (
                    <VehicleListCard key={item.vehicle.id} {...item} />
                  ))}
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </PagePanel>
  )
}
