import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser, resolveVehiclePhotoUrl } from '../vehicles/vehiclesApi'
import { formatVehicleKind } from '../vehicles/vehicleTypes'
import { VehiclePhotoThumb } from '../vehicles/VehiclePhoto'
import { listRecentResearchForUser } from '../research/researchApi'
import type { Vehicle, FixResearchNote } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

type VehicleListItem = {
  vehicle: Vehicle
  photoUrl: string | null
}

export function DashboardPage() {
  const { user, isDemoMode } = useAuth()
  const [vehicleItems, setVehicleItems] = useState<VehicleListItem[]>([])
  const [recentResearch, setRecentResearch] = useState<FixResearchNote[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    async function loadDashboard() {
      try {
        const [vehicleRows, researchRows] = await Promise.all([
          listVehiclesForUser(user!.id),
          listRecentResearchForUser(user!.id),
        ])
        const items = await Promise.all(
          vehicleRows.map(async (vehicle) => ({
            vehicle,
            photoUrl: await resolveVehiclePhotoUrl(vehicle.photo_path),
          })),
        )
        if (!isMounted) return
        setVehicleItems(items)
        setRecentResearch(researchRows)
      } catch (error) {
        if (!isMounted) return
        setLoadError(error instanceof Error ? error.message : 'Failed to load dashboard')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      isMounted = false
    }
  }, [user])

  if (isLoading) return <PageLoadingState label="Loading garage…" />

  if (loadError) {
    return (
      <PagePanel>
        <Typography variant="h1" gutterBottom>
          Home
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Typography color="text.secondary">
          If this mentions a missing table, finish the SQL migration steps in{' '}
          <code>docs/supabase-setup.md</code>.
        </Typography>
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">Home</Typography>
        {!isDemoMode ? (
          <Button component={RouterLink} to="/vehicles/new" variant="outlined">
            Add vehicle
          </Button>
        ) : null}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Vehicles', value: vehicleItems.length },
          { label: 'Recent research', value: recentResearch.length },
        ].map((summary) => (
          <Grid key={summary.label} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {summary.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {summary.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={4}>
        <section>
          <Typography variant="h2" gutterBottom>
            Your vehicles
          </Typography>
          {vehicleItems.length === 0 ? (
            <Typography color="text.secondary">No vehicles yet. Add your first one to start logging work.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {vehicleItems.map(({ vehicle, photoUrl }) => (
                <Card key={vehicle.id} variant="outlined">
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
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          )}
        </section>

        <section>
          <Stack direction="row" sx={{ mb: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h2">Recent research</Typography>
            {!isDemoMode ? (
              <Button component={RouterLink} to="/research/new" size="small" variant="text">
                New note
              </Button>
            ) : null}
          </Stack>
          {recentResearch.length === 0 ? (
            <Typography color="text.secondary">No research notes yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {recentResearch.map((note) => (
                <Card key={note.id} variant="outlined">
                  <CardActionArea component={RouterLink} to={`/research/${note.id}`}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 600 }}>{note.title}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          )}
        </section>
      </Stack>
    </PagePanel>
  )
}
