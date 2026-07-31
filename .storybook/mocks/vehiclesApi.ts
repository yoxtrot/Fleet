import type { Vehicle } from '../../src/lib/database.types'
import { samplePhotoUrl, sampleVehicles } from './fixtures'

export const VEHICLE_PHOTOS_BUCKET = 'vehicle-photos'

export type VehicleDraft = {
  nickname: string
  year: number | null
  make: string
  model: string
  vehicle_type: 'car' | 'bike' | 'motorcycle'
  vehicle_subtype: 'road' | 'gravel' | 'mountain' | 'street' | 'dirt_bike' | null
  current_mileage: number | null
  notes: string | null
}

export async function listVehiclesForUser(_userId: string) {
  return sampleVehicles
}

export async function getVehicleById(vehicleId: string) {
  const vehicle = sampleVehicles.find((row) => row.id === vehicleId)
  if (!vehicle) throw new Error('Vehicle not found')
  return vehicle
}

export async function createVehicleForUser(userId: string, draft: VehicleDraft) {
  return {
    id: 'vehicle-new',
    user_id: userId,
    photo_path: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...draft,
  } satisfies Vehicle
}

export async function updateVehicle(vehicleId: string, draft: VehicleDraft) {
  const existing = await getVehicleById(vehicleId)
  return { ...existing, ...draft, updated_at: new Date().toISOString() }
}

export function getVehiclePhotoPublicUrl(photoPath: string | null | undefined) {
  if (!photoPath) return null
  return samplePhotoUrl
}

export async function resolveVehiclePhotoUrl(photoPath: string | null | undefined) {
  return getVehiclePhotoPublicUrl(photoPath)
}

export async function uploadVehiclePhoto(userId: string, vehicleId: string, _file: File) {
  const existing = await getVehicleById(vehicleId)
  return {
    ...existing,
    photo_path: `${userId}/${vehicleId}/photo.jpg`,
    updated_at: new Date().toISOString(),
  }
}

export async function clearVehiclePhoto(vehicle: Vehicle) {
  return { ...vehicle, photo_path: null, updated_at: new Date().toISOString() }
}

export async function deleteVehicle(_vehicleId: string) {
  return undefined
}
