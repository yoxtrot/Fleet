import { VEHICLE_TYPES, type VehicleType } from './vehicleTypes'

export function groupItemsByVehicleType<T extends { vehicle: { vehicle_type: VehicleType } }>(
  items: T[],
) {
  const groups = Object.fromEntries(VEHICLE_TYPES.map((type) => [type, [] as T[]])) as Record<
    VehicleType,
    T[]
  >

  for (const item of items) {
    groups[item.vehicle.vehicle_type].push(item)
  }

  return VEHICLE_TYPES.map((type) => ({
    type,
    items: groups[type],
  })).filter((group) => group.items.length > 0)
}
