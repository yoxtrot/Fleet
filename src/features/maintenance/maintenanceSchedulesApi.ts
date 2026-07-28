import { supabase } from '../../lib/supabase'
import type { MaintenanceSchedule } from '../../lib/database.types'

export type MaintenanceScheduleDraft = {
  vehicle_id: string
  description: string
  mileage_interval_miles: number | null
  time_interval_days: number | null
}

export async function listMaintenanceSchedulesForVehicle(vehicleId: string) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as MaintenanceSchedule[]
}

export async function createMaintenanceSchedule(userId: string, draft: MaintenanceScheduleDraft) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert({ ...draft, user_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data as MaintenanceSchedule
}

export async function deleteMaintenanceSchedule(scheduleId: string) {
  const { error } = await supabase.from('maintenance_schedules').delete().eq('id', scheduleId)
  if (error) throw error
}

export function formatMaintenanceScheduleInterval(schedule: MaintenanceSchedule) {
  const parts: string[] = []
  if (schedule.mileage_interval_miles != null) {
    parts.push(`Every ${schedule.mileage_interval_miles.toLocaleString()} mi`)
  }
  if (schedule.time_interval_days != null) {
    parts.push(`Every ${schedule.time_interval_days} day${schedule.time_interval_days === 1 ? '' : 's'}`)
  }
  return parts.join(' · ')
}
