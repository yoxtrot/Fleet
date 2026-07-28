import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { listVehiclesForUser } from '../vehicles/vehiclesApi'
import { listResearchNotesForUser } from './researchApi'
import type { FixResearchNote, Vehicle } from '../../lib/database.types'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function ResearchListPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<FixResearchNote[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    Promise.all([listResearchNotesForUser(user.id), listVehiclesForUser(user.id)])
      .then(([noteRows, vehicleRows]) => {
        if (!isMounted) return
        setNotes(noteRows)
        setVehicles(vehicleRows)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load research')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const vehicleNicknameById = useMemo(() => {
    return new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.nickname]))
  }, [vehicles])

  const filteredNotes = useMemo(() => {
    const normalizedTag = tagFilter.trim().toLowerCase()
    return notes.filter((note) => {
      const matchesVehicle = vehicleFilter === 'all' || note.vehicle_id === vehicleFilter
      const matchesTag =
        normalizedTag === '' || note.tags.some((tag) => tag.toLowerCase().includes(normalizedTag))
      return matchesVehicle && matchesTag
    })
  }, [notes, vehicleFilter, tagFilter])

  if (isLoading) return <PageLoadingState label="Loading research…" />

  return (
    <PagePanel>
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h1">Fix research</Typography>
        <Button component={RouterLink} to="/research/new">
          New note
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="vehicle-filter-label">Vehicle</InputLabel>
          <Select
            labelId="vehicle-filter-label"
            label="Vehicle"
            value={vehicleFilter}
            onChange={(event) => setVehicleFilter(event.target.value)}
          >
            <MenuItem value="all">All vehicles</MenuItem>
            {vehicles.map((vehicle) => (
              <MenuItem key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Tag contains"
          placeholder="brakes"
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
        />
      </Stack>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {filteredNotes.length === 0 && !loadError ? (
        <Typography color="text.secondary">No research notes match these filters.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {filteredNotes.map((note) => (
            <Card key={note.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/research/${note.id}`}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700 }}>{note.title}</Typography>
                  <Typography color="text.secondary">
                    {note.vehicle_id
                      ? vehicleNicknameById.get(note.vehicle_id) ?? 'Unknown vehicle'
                      : 'No vehicle'}
                  </Typography>
                  {note.tags.length > 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      {note.tags.join(', ')}
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
