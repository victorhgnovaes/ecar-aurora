import type { ReactNode } from 'react'
import type { VehicleSummary } from '../../types/vehicle'
import { CatalogContext } from '../../hooks/catalogContext'
import { useRequest } from '../../hooks/useRequest'
export function CatalogProvider({ children }: { children: ReactNode }) {
  const catalog = useRequest<VehicleSummary[]>('/vehicles')
  const meta = useRequest<{ whatsappNumber: string | null }>('/catalog/meta')
  return <CatalogContext.Provider value={{ vehicles: catalog.data || [], loading: catalog.loading, error: catalog.error ? 'Não foi possível carregar os veículos. Tente novamente.' : null, whatsappNumber: meta.data?.whatsappNumber || null, retry: catalog.retry }}>{children}</CatalogContext.Provider>
}
