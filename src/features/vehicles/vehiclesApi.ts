import { supabase } from '../../lib/supabase'
import type { Vehicle } from '../../lib/database.types'

export type VehicleDraft = {
  nickname: string
  year: number | null
  make: string
  model: string
  vin: string | null
  current_mileage: number | null
  notes: string | null
}

export async function listVehiclesForUser(userId: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('nickname', { ascending: true })

  if (error) throw error
  return data as Vehicle[]
}

export async function getVehicleById(vehicleId: string) {
  const { data, error } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single()
  if (error) throw error
  return data as Vehicle
}

export async function createVehicleForUser(userId: string, draft: VehicleDraft) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...draft, user_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data as Vehicle
}

export async function updateVehicle(vehicleId: string, draft: VehicleDraft) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...draft, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select('*')
    .single()

  if (error) throw error
  return data as Vehicle
}

export async function deleteVehicle(vehicleId: string) {
  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
  if (error) throw error
}
