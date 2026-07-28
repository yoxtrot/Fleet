import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from './vehiclesApi'
import type { Vehicle } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function VehicleListPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    listVehiclesForUser(user.id)
      .then((rows) => {
        if (isMounted) setVehicles(rows)
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

  if (isLoading) return <PageLoadingState label="Loading vehicles…" />

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">Vehicles</Typography>
        <Button component={RouterLink} to="/vehicles/new">
          Add vehicle
        </Button>
      </Stack>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {vehicles.length === 0 && !loadError ? (
        <Typography color="text.secondary">Your fleet is empty. Add a vehicle to get started.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/vehicles/${vehicle.id}`}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700 }}>{vehicle.nickname}</Typography>
                  <Typography color="text.secondary">
                    {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                  </Typography>
                  {vehicle.current_mileage != null ? (
                    <Typography color="text.secondary" variant="body2">
                      {vehicle.current_mileage.toLocaleString()} mi
                    </Typography>
                  ) : null}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </PagePanel>
  )
}
