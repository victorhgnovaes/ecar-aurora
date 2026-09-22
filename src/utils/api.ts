const base = import.meta.env.VITE_API_URL || '/api'
export class ApiError extends Error {
  status: number
  constructor(status: number) { super('Não foi possível carregar o catálogo.'); this.status = status }
}
export async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) })
  if (!response.ok) throw new ApiError(response.status)
  return response.json()
}
