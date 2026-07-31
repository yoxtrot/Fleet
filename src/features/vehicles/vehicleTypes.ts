export const VEHICLE_TYPES = ['car', 'bike', 'motorcycle'] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const BIKE_SUBTYPES = ['road', 'gravel', 'mountain'] as const
export type BikeSubtype = (typeof BIKE_SUBTYPES)[number]

export const MOTORCYCLE_SUBTYPES = ['street', 'dirt_bike'] as const
export type MotorcycleSubtype = (typeof MOTORCYCLE_SUBTYPES)[number]

export type VehicleSubtype = BikeSubtype | MotorcycleSubtype

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Car',
  bike: 'Bike',
  motorcycle: 'Motorcycle',
}

export const VEHICLE_SUBTYPE_LABELS: Record<VehicleSubtype, string> = {
  road: 'Road',
  gravel: 'Gravel',
  mountain: 'Mountain',
  street: 'Street',
  dirt_bike: 'Dirt bike',
}

export function subtypesForVehicleType(type: VehicleType): readonly VehicleSubtype[] {
  if (type === 'bike') return BIKE_SUBTYPES
  if (type === 'motorcycle') return MOTORCYCLE_SUBTYPES
  return []
}

export function isValidVehicleSubtype(
  type: VehicleType,
  subtype: string | null | undefined,
): subtype is VehicleSubtype | null {
  if (type === 'car') return subtype == null || subtype === ''
  const allowed = subtypesForVehicleType(type)
  return typeof subtype === 'string' && (allowed as readonly string[]).includes(subtype)
}

export function formatVehicleKind(type: VehicleType, subtype: string | null | undefined) {
  const typeLabel = VEHICLE_TYPE_LABELS[type] ?? type
  if (!subtype) return typeLabel
  const subtypeLabel = VEHICLE_SUBTYPE_LABELS[subtype as VehicleSubtype] ?? subtype
  return `${typeLabel} · ${subtypeLabel}`
}
