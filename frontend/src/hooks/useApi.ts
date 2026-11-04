import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/lib/api'

interface Options {
  /** Vuelve a pedir los datos cada N ms (precios en vivo). */
  pollMs?: number
  /** Eventos de ventana que obligan a recargar (ej. 'cp:wallet-changed'). */
  refreshOn?: string[]
}

/**
 * Pide datos a la API con los 3 estados: loading / error / data.
 * Mientras se refresca en segundo plano, conserva los datos anteriores (sin parpadeos).
 */
export function useApi<T>(path: string | null, { pollMs, refreshOn = [] }: Options = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState<boolean>(!!path)
  const ctrlRef = useRef<AbortController | null>(null)

  const load = useCallback(
    async (silent = false) => {
      if (!path) return
      ctrlRef.current?.abort()
      const ctrl = new AbortController()
      ctrlRef.current = ctrl
      if (!silent) setLoading(true)
      try {
        const res = await api<T>(path, { signal: ctrl.signal })
        if (!ctrl.signal.aborted) {
          setData(res)
          setError(null)
        }
      } catch (e) {
        if (ctrl.signal.aborted) return
        setError(e instanceof ApiError ? e : new ApiError('Algo salió mal. Intenta de nuevo.', 0))
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    },
    [path],
  )

  useEffect(() => {
    setData(null)
    load()
    return () => ctrlRef.current?.abort()
  }, [load])

  useEffect(() => {
    if (!pollMs || !path) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load(true)
    }, pollMs)
    return () => clearInterval(id)
  }, [pollMs, path, load])

  const events = refreshOn.join(',')
  useEffect(() => {
    if (!events) return
    const handler = () => load(true)
    const list = events.split(',')
    list.forEach((ev) => window.addEventListener(ev, handler))
    return () => list.forEach((ev) => window.removeEventListener(ev, handler))
  }, [events, load])

  return { data, error, loading: loading && !data, refreshing: loading, reload: () => load(), setData }
}
