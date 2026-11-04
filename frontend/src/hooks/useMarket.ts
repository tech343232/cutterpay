import { useApi } from './useApi'
import type { Coin, Wallet } from '@/types'

export const PRICE_POLL_MS = 5000

export function useMarket() {
  const res = useApi<{ coins: Coin[]; serverTime: string }>('/mercado', { pollMs: PRICE_POLL_MS, refreshOn: ['cp:wallet-changed'] })
  return { ...res, coins: res.data?.coins ?? [] }
}

export function useWallet() {
  return useApi<Wallet>('/billetera', { pollMs: PRICE_POLL_MS * 2, refreshOn: ['cp:wallet-changed'] })
}
