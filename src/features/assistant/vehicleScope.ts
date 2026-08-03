import { createContext, useContext, useEffect } from 'react'

export type VehicleScope = {
  vehicleId: string
  vehicleName: string
}

export type VehicleScopeValue = {
  scope: VehicleScope | null
  declareVehicleScope: (scope: VehicleScope | null) => void
}

export const VehicleScopeContext = createContext<VehicleScopeValue | null>(null)

const VEHICLE_ROUTE_PATTERN =
  /^\/vehicles\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i

/**
 * Reads the vehicle a route is about, so the assistant follows what the user is viewing.
 * Matching on a uuid keeps literal routes such as `/vehicles/new` out of scope.
 */
export function readVehicleIdFromPath(pathname: string) {
  return VEHICLE_ROUTE_PATTERN.exec(pathname)?.[1] ?? null
}

export function useVehicleScope() {
  const context = useContext(VehicleScopeContext)
  if (!context) throw new Error('useVehicleScope must be used within VehicleScopeProvider')
  return context
}

/**
 * Lets a page that is not under `/vehicles/:vehicleId` — a research note, say — put the
 * assistant in scope for the vehicle that page is about.
 */
export function useDeclareVehicleScope(scope: VehicleScope | null) {
  const { declareVehicleScope } = useVehicleScope()
  const vehicleId = scope?.vehicleId ?? null
  const vehicleName = scope?.vehicleName ?? null

  useEffect(() => {
    if (!vehicleId || !vehicleName) return undefined
    declareVehicleScope({ vehicleId, vehicleName })
    return () => declareVehicleScope(null)
  }, [vehicleId, vehicleName, declareVehicleScope])
}
