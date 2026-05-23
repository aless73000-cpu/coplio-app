'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiOptions {
  /** If false, the request won't fire automatically (useful for POST-triggered fetches). Default: true */
  immediate?: boolean
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Re-trigger the fetch manually */
  refetch: () => void
}

/**
 * Generic hook for GET requests.
 *
 * @example
 * const { data, loading, error } = useApi<Copropriete[]>('/api/coproprietes')
 * const { data, refetch } = useApi<Vote[]>('/api/votes', { immediate: false })
 */
export function useApi<T = unknown>(url: string, options: UseApiOptions = {}): UseApiState<T> {
  const { immediate = true } = options
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Cancel previous in-flight request
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as T
      setData(json)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (immediate) fetchData()
    return () => { abortRef.current?.abort() }
  }, [immediate, fetchData])

  return { data, loading, error, refetch: fetchData }
}
