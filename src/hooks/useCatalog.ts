import { useContext } from 'react'
import type { Vehicle } from '../types/vehicle'
import { CatalogContext } from './catalogContext'
import { useRequest } from './useRequest'
export function useCatalog() { const context = useContext(CatalogContext); if (!context) throw new Error('CatalogProvider ausente'); return context }
export function useVehicle(slug: string | undefined) {
  const result = useRequest<Vehicle>(`/vehicles/${encodeURIComponent(slug || '')}`)
  return { ...result, vehicle: result.data }
}
