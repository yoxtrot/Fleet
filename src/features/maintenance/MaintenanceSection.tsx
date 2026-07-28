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
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  listMaintenanceForVehicle,
  type MaintenanceDraft,
} from './maintenanceApi'
import type { MaintenanceRecord } from '../../lib/database.types'

type MaintenanceSectionProps = {
  vehicleId: string
  userId: string
}

function dollarsToCents(value: string) {
  if (value.trim() === '') return null
  const dollars = Number(value)
  if (!Number.isFinite(dollars)) return null
  return Math.round(dollars * 100)
}

function formatCost(cents: number | null) {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function MaintenanceSection({ vehicleId, userId }: MaintenanceSectionProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [performedOn, setPerformedOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [mileage, setMileage] = useState('')
  const [costDollars, setCostDollars] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [notes, setNotes] = useState('')

  async function refreshRecords() {
    const rows = await listMaintenanceForVehicle(vehicleId)
    setRecords(rows)
  }

  useEffect(() => {
    let isMounted = true
    listMaintenanceForVehicle(vehicleId)
      .then((rows) => {
        if (isMounted) setRecords(rows)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Failed to load maintenance')
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
    setIsSaving(true)

    const draft: MaintenanceDraft = {
      vehicle_id: vehicleId,
      title,
      performed_on: performedOn,
      mileage: mileage.trim() === '' ? null : Number(mileage),
      cost_cents: dollarsToCents(costDollars),
      performed_by: performedBy.trim() || null,
      notes: notes.trim() || null,
    }

    try {
      await createMaintenanceRecord(userId, draft)
      setTitle('')
      setMileage('')
      setCostDollars('')
      setPerformedBy('')
      setNotes('')
      await refreshRecords()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save maintenance')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(recordId: string) {
    const confirmed = window.confirm('Delete this maintenance record?')
    if (!confirmed) return
    await deleteMaintenanceRecord(recordId)
    await refreshRecords()
  }

  return (
    <Box component="section">
      <Typography variant="h2" gutterBottom>
        Maintenance
      </Typography>

      {isLoading ? <Typography color="text.secondary">Loading history…</Typography> : null}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {records.map((record) => (
          <Box
            key={record.id}
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
              <Typography sx={{ fontWeight: 700 }}>{record.title}</Typography>
              <Typography color="text.secondary" variant="body2">
                {record.performed_on}
                {record.mileage != null ? ` · ${record.mileage.toLocaleString()} mi` : ''}
                {` · ${formatCost(record.cost_cents)}`}
                {record.performed_by ? ` · ${record.performed_by}` : ''}
              </Typography>
              {record.notes ? <Typography sx={{ mt: 1 }}>{record.notes}</Typography> : null}
            </Box>
            <Button color="error" variant="outlined" onClick={() => void handleDelete(record.id)}>
              Delete
            </Button>
          </Box>
        ))}
      </Stack>

      {records.length === 0 && !isLoading && !loadError ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No maintenance logged for this vehicle yet.
        </Typography>
      ) : null}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h3" gutterBottom>
        Log work
      </Typography>
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Date"
              type="date"
              value={performedOn}
              onChange={(event) => setPerformedOn(event.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Mileage"
              type="number"
              value={mileage}
              onChange={(event) => setMileage(event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Cost (USD)"
              type="number"
              slotProps={{ htmlInput: { step: '0.01' } }}
              value={costDollars}
              onChange={(event) => setCostDollars(event.target.value)}
            />
          </Grid>
        </Grid>
        <TextField
          label="Shop / DIY"
          value={performedBy}
          onChange={(event) => setPerformedBy(event.target.value)}
        />
        <TextField
          label="Notes"
          multiline
          minRows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Add maintenance'}
        </Button>
      </Stack>
    </Box>
  )
}
