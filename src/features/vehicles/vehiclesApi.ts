import { supabase } from '../../lib/supabase'
import type { Vehicle } from '../../lib/database.types'

export const VEHICLE_PHOTOS_BUCKET = 'vehicle-photos'
const MAX_VEHICLE_PHOTO_BYTES = 5 * 1024 * 1024
const ALLOWED_VEHICLE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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

export function getVehiclePhotoPublicUrl(photoPath: string | null | undefined) {
  if (!photoPath) return null
  const { data } = supabase.storage.from(VEHICLE_PHOTOS_BUCKET).getPublicUrl(photoPath)
  return data.publicUrl
}

/** Prefer a signed URL so list/detail images work even if the bucket is private. */
export async function resolveVehiclePhotoUrl(photoPath: string | null | undefined) {
  if (!photoPath) return null

  const { data, error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .createSignedUrl(photoPath, 60 * 60)

  if (!error && data.signedUrl) return data.signedUrl
  return getVehiclePhotoPublicUrl(photoPath)
}

function extensionForPhoto(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function assertValidVehiclePhoto(file: File) {
  if (!ALLOWED_VEHICLE_PHOTO_TYPES.has(file.type)) {
    throw new Error('Vehicle photo must be a JPEG, PNG, or WebP image')
  }
  if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
    throw new Error('Vehicle photo must be 5 MB or smaller')
  }
}

export async function uploadVehiclePhoto(userId: string, vehicleId: string, file: File) {
  assertValidVehiclePhoto(file)

  const photoPath = `${userId}/${vehicleId}/photo.${extensionForPhoto(file)}`
  const { error: uploadError } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(photoPath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    const message = uploadError.message.toLowerCase()
    if (message.includes('bucket') || message.includes('not found')) {
      throw new Error(
        'Vehicle photo storage is not set up yet. Run supabase/migrations/20260728140000_vehicle_photos.sql in the Supabase SQL Editor, then try again.',
      )
    }
    throw uploadError
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({ photo_path: photoPath, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select('*')
    .single()

  if (error) {
    if (error.message.toLowerCase().includes('photo_path')) {
      throw new Error(
        'Vehicle photo column is missing. Run supabase/migrations/20260728140000_vehicle_photos.sql in the Supabase SQL Editor, then try again.',
      )
    }
    throw error
  }
  return data as Vehicle
}

export async function clearVehiclePhoto(vehicle: Vehicle) {
  if (vehicle.photo_path) {
    const { error: removeError } = await supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .remove([vehicle.photo_path])
    if (removeError) throw removeError
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({ photo_path: null, updated_at: new Date().toISOString() })
    .eq('id', vehicle.id)
    .select('*')
    .single()

  if (error) throw error
  return data as Vehicle
}

export async function deleteVehicle(vehicleId: string) {
  const vehicle = await getVehicleById(vehicleId)
  if (vehicle.photo_path) {
    await supabase.storage.from(VEHICLE_PHOTOS_BUCKET).remove([vehicle.photo_path])
  }

  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
  if (error) throw error
}
