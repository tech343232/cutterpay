import { useLiveValue } from '@/hooks/useFunds'
import { cn } from '@/lib/utils'

/** Cifra en dólares que sube sola cada décima de segundo (los 4 decimales extra se ven más tenues). */
export function LiveMoney({ base, perSecond, className, decimals = 6 }: { base: number; perSecond: number; className?: string; decimals?: number }) {
  const v = useLiveValue(base, perSecond)
  const [int, dec] = v.toFixed(decimals).split('.')
  const intFmt = Number(int).toLocaleString('en-US')
  return (
    <span className={cn('tabular', className)} aria-label={`$${v.toFixed(2)}`}>
      ${intFmt}.{dec.slice(0, 2)}
      <span className="opacity-50">{dec.slice(2)}</span>
    </span>
  )
}
