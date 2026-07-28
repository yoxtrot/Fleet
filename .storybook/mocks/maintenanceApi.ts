import type { MaintenanceRecord } from '../../src/lib/database.types'
import { sampleMaintenance, sampleUserId } from './fixtures'

export type MaintenanceDraft = {
  vehicle_id: string
  performed_on: string
  mileage: number | null
  title: string
  cost_cents: number | null
  performed_by: string | null
  notes: string | null
}

let records = [...sampleMaintenance]

export async function listMaintenanceForVehicle(vehicleId: string) {
  return records.filter((row) => row.vehicle_id === vehicleId)
}

export async function listRecentMaintenanceForUser(_userId: string, limit = 5) {
  return records.slice(0, limit)
}

export async function createMaintenanceRecord(userId: string, draft: MaintenanceDraft) {
  const created: MaintenanceRecord = {
    id: `maint-${records.length + 1}`,
    user_id: userId || sampleUserId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...draft,
  }
  records = [created, ...records]
  return created
}

export async function deleteMaintenanceRecord(recordId: string) {
  records = records.filter((row) => row.id !== recordId)
}
