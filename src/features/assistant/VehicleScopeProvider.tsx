import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { getVehicleById } from '../vehicles/vehiclesApi'
import {
  readVehicleIdFromPath,
  VehicleScopeContext,
  type VehicleScope,
} from './vehicleScope'

export function VehicleScopeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [routeScope, setRouteScope] = useState<VehicleScope | null>(null)
  const [declaredScope, setDeclaredScope] = useState<VehicleScope | null>(null)

  const routeVehicleId = readVehicleIdFromPath(pathname)

  useEffect(() => {
    if (!routeVehicleId || !user) {
      setRouteScope(null)
      return undefined
    }

    let isMounted = true
    getVehicleById(routeVehicleId)
      .then((vehicle) => {
        if (isMounted) setRouteScope({ vehicleId: vehicle.id, vehicleName: vehicle.nickname })
      })
      .catch(() => {
        if (isMounted) setRouteScope(null)
      })

    return () => {
      isMounted = false
    }
  }, [routeVehicleId, user])

  const declareVehicleScope = useCallback((scope: VehicleScope | null) => {
    setDeclaredScope(scope)
  }, [])

  const value = useMemo(
    () => ({ scope: routeScope ?? declaredScope, declareVehicleScope }),
    [routeScope, declaredScope, declareVehicleScope],
  )

  return <VehicleScopeContext.Provider value={value}>{children}</VehicleScopeContext.Provider>
}
