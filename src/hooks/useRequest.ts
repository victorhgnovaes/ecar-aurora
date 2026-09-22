import { useEffect, useState, useCallback } from 'react'
import { ApiError, get } from '../utils/api'
export function useRequest<T>(path: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; data: T | null; error: number | null } | null>(null)
  const key = `${path}:${attempt}`
  useEffect(() => {
    const controller = new AbortController()
    get<T>(path,controller.signal)
      .then(data => { if (!controller.signal.aborted) setResult({ key, data, error: null }) })
      .catch(error => { if (!controller.signal.aborted) setResult({ key, data: null, error: error instanceof ApiError ? error.status : 500 }) })
    return () => controller.abort()
  }, [path,key])
  const current = result?.key === key ? result : null
  const retry = useCallback(() => setAttempt(n => n+1),[])
  return { data: current?.data ?? null, loading: !current, error: current?.error ?? null, retry }
}
