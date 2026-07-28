import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  createMaintenanceSchedule,
  deleteMaintenanceSchedule,
  formatMaintenanceScheduleInterval,
  listMaintenanceSchedulesForVehicle,
} from './maintenanceSchedulesApi'
import type { MaintenanceSchedule } from '../../lib/database.types'

type MaintenanceSchedulesSectionProps = {
  vehicleId: string
  userId: string
}

function parseOptionalPositiveInteger(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function MaintenanceSchedulesSection({ vehicleId, userId }: MaintenanceSchedulesSectionProps) {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [description, setDescription] = useState('')
  const [mileageInterval, setMileageInterval] = useState('')
  const [timeIntervalDays, setTimeIntervalDays] = useState('')

  async function refreshSchedules() {
    const rows = await listMaintenanceSchedulesForVehicle(vehicleId)
    setSchedules(rows)
  }

  useEffect(() => {
    let isMounted = true
    listMaintenanceSchedulesForVehicle(vehicleId)
      .then((rows) => {
        if (isMounted) setSchedules(rows)
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load maintenance schedules')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [vehicleId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const mileageIntervalMiles = parseOptionalPositiveInteger(mileageInterval)
    const timeInterval = parseOptionalPositiveInteger(timeIntervalDays)

    if (!description.trim()) {
      setFormError('Add a description for this maintenance item.')
      return
    }
    if (mileageIntervalMiles == null && timeInterval == null) {
      setFormError('Set a mileage interval, a time interval (days), or both.')
      return
    }
    if (mileageInterval.trim() !== '' && mileageIntervalMiles == null) {
      setFormError('Mileage interval must be a positive whole number.')
      return
    }
    if (timeIntervalDays.trim() !== '' && timeInterval == null) {
      setFormError('Time interval must be a positive whole number of days.')
      return
    }

    setIsSaving(true)
    try {
      await createMaintenanceSchedule(userId, {
        vehicle_id: vehicleId,
        description: description.trim(),
        mileage_interval_miles: mileageIntervalMiles,
        time_interval_days: timeInterval,
      })
      setDescription('')
      setMileageInterval('')
      setTimeIntervalDays('')
      await refreshSchedules()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save maintenance schedule')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(scheduleId: string) {
    const confirmed = window.confirm('Delete this maintenance schedule?')
    if (!confirmed) return
    await deleteMaintenanceSchedule(scheduleId)
    await refreshSchedules()
  }

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography variant="h2" gutterBottom>
        Maintenance
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Track recurring service items with a mileage interval, a time interval, or both.
      </Typography>

      {isLoading ? <Typography color="text.secondary">Loading schedules…</Typography> : null}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {schedules.map((schedule) => (
          <Box
            key={schedule.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
              gap: 1.5,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{schedule.description}</Typography>
              <Typography color="text.secondary" variant="body2">
                {formatMaintenanceScheduleInterval(schedule)}
              </Typography>
            </Box>
            <Button color="error" variant="outlined" onClick={() => void handleDelete(schedule.id)}>
              Delete
            </Button>
          </Box>
        ))}
      </Stack>

      {!isLoading && !loadError && schedules.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No maintenance schedules yet.
        </Typography>
      ) : null}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h3" gutterBottom>
        Add maintenance
      </Typography>
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          placeholder="Oil change, tire rotation, brake fluid…"
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Mileage interval (mi)"
              type="number"
              value={mileageInterval}
              onChange={(event) => setMileageInterval(event.target.value)}
              helperText="Optional. Example: 5000"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Time interval (days)"
              type="number"
              value={timeIntervalDays}
              onChange={(event) => setTimeIntervalDays(event.target.value)}
              helperText="Optional. Example: 180 for ~6 months"
            />
          </Grid>
        </Grid>
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Add maintenance'}
        </Button>
      </Stack>
    </Box>
  )
}
