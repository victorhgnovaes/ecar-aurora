const base = import.meta.env.VITE_API_URL || '/api'
const staticCatalog = import.meta.env.VITE_CATALOG_MODE === 'static'
export class ApiError extends Error {
  status: number
  constructor(status: number) { super('Não foi possível carregar o catálogo.'); this.status = status }
}
export async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const url = staticCatalog ? `/catalog${path}.json` : `${base}${path}`
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) })
  if (!response.ok) throw new ApiError(response.status)
  // SPA hosts can return index.html for a missing catalog file.
  if (staticCatalog && !response.headers.get('content-type')?.includes('application/json')) throw new ApiError(404)
  return response.json()
}
