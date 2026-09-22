import { createContext } from 'react'
import type { VehicleSummary } from '../types/vehicle'
export interface CatalogState { vehicles: VehicleSummary[]; loading: boolean; error: string | null; whatsappNumber: string | null; retry: () => void }
export const CatalogContext = createContext<CatalogState | null>(null)
