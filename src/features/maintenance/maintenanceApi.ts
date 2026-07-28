import { supabase } from '../../lib/supabase'
import type { MaintenanceRecord } from '../../lib/database.types'

export type MaintenanceDraft = {
  vehicle_id: string
  performed_on: string
  mileage: number | null
  title: string
  cost_cents: number | null
  performed_by: string | null
  notes: string | null
}

export async function listMaintenanceForVehicle(vehicleId: string) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('performed_on', { ascending: false })

  if (error) throw error
  return data as MaintenanceRecord[]
}

export async function listRecentMaintenanceForUser(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('user_id', userId)
    .order('performed_on', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as MaintenanceRecord[]
}

export async function createMaintenanceRecord(userId: string, draft: MaintenanceDraft) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({ ...draft, user_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data as MaintenanceRecord
}

export async function deleteMaintenanceRecord(recordId: string) {
  const { error } = await supabase.from('maintenance_records').delete().eq('id', recordId)
  if (error) throw error
}
