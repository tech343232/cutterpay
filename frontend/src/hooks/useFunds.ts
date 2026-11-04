import { useEffect, useRef, useState } from 'react'
import { useApi } from './useApi'
import type { Fund, ReferenceRate, UserFunds } from '@/types'

export function useFundCatalog() {
  const res = useApi<{ funds: Fund[]; referenceRates: ReferenceRate[] }>('/fondos')
  const savings = res.data?.referenceRates.find((r) => r.product.toLowerCase().includes('ahorro'))
  return { ...res, funds: res.data?.funds ?? [], referenceRates: res.data?.referenceRates ?? [], bankRate: savings?.rate ?? 0.75 }
}

export function useMyFunds() {
  return useApi<UserFunds>('/fondos/mios', { pollMs: 30000, refreshOn: ['cp:wallet-changed'] })
}

/**
 * Valor que crece en vivo: parte del valor que dio el servidor y le suma lo que gana por segundo.
 * Así el usuario VE su dinero crecer (con 6 decimales).
 */
export function useLiveValue(base: number | undefined, perSecond: number | undefined) {
  const [value, setValue] = useState(base ?? 0)
  const start = useRef(performance.now())
  useEffect(() => {
    start.current = performance.now()
    setValue(base ?? 0)
    if (base === undefined || !perSecond) return
    const id = setInterval(() => {
      setValue(base + perSecond * ((performance.now() - start.current) / 1000))
    }, 100)
    return () => clearInterval(id)
  }, [base, perSecond])
  return value
}
