import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from '../vehicles/vehiclesApi'
import { listRecentMaintenanceForUser } from '../maintenance/maintenanceApi'
import { listRecentResearchForUser } from '../research/researchApi'
import type { Vehicle, MaintenanceRecord, FixResearchNote } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function DashboardPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceRecord[]>([])
  const [recentResearch, setRecentResearch] = useState<FixResearchNote[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    async function loadDashboard() {
      try {
        const [vehicleRows, maintenanceRows, researchRows] = await Promise.all([
          listVehiclesForUser(user!.id),
          listRecentMaintenanceForUser(user!.id),
          listRecentResearchForUser(user!.id),
        ])
        if (!isMounted) return
        setVehicles(vehicleRows)
        setRecentMaintenance(maintenanceRows)
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
        <Button component={RouterLink} to="/vehicles/new" variant="outlined">
          Add vehicle
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Vehicles', value: vehicles.length },
          { label: 'Recent maintenance', value: recentMaintenance.length },
          { label: 'Recent research', value: recentResearch.length },
        ].map((summary) => (
          <Grid key={summary.label} size={{ xs: 12, sm: 4 }}>
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
          {vehicles.length === 0 ? (
            <Typography color="text.secondary">No vehicles yet. Add your first one to start logging work.</Typography>
          ) : (
            <List disablePadding>
              {vehicles.map((vehicle) => (
                <ListItem key={vehicle.id} disableGutters>
                  <ListItemText
                    primary={
                      <Typography component={RouterLink} to={`/vehicles/${vehicle.id}`} color="primary">
                        {vehicle.nickname}
                      </Typography>
                    }
                    secondary={[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </section>

        <section>
          <Typography variant="h2" gutterBottom>
            Recent maintenance
          </Typography>
          {recentMaintenance.length === 0 ? (
            <Typography color="text.secondary">No maintenance logged yet.</Typography>
          ) : (
            <List disablePadding>
              {recentMaintenance.map((record) => (
                <ListItem key={record.id} disableGutters>
                  <ListItemText primary={record.title} secondary={record.performed_on} />
                </ListItem>
              ))}
            </List>
          )}
        </section>

        <section>
          <Stack direction="row" sx={{ mb: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h2">Recent research</Typography>
            <Button component={RouterLink} to="/research/new" size="small" variant="text">
              New note
            </Button>
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
