import { Link } from 'react-router-dom'
import { CoinIcon } from '@/components/ui/Misc'
import { Change } from '@/components/ui/Feedback'
import { Sparkline } from '@/components/charts/Sparkline'
import { usd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Coin } from '@/types'

/** Tarjeta de precio en vivo de una moneda. */
export function CoinTicker({ coin, to, selected, onClick }: { coin: Coin; to?: string; selected?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <CoinIcon symbol={coin.symbol} color={coin.color} size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold leading-tight">{coin.name}</p>
          <p className="text-xs font-semibold text-muted">{coin.symbol}{!coin.active && ' · pausada'}</p>
        </div>
        <Sparkline data={coin.spark} width={84} height={32} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span key={coin.price} className="tabular animate-flash rounded-md font-display text-xl font-bold">{usd(coin.price, { price: true })}</span>
        <Change value={coin.change24h} className="text-sm" />
      </div>
    </>
  )
  const cls = cn(
    'block rounded-3xl border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40',
    selected ? 'border-primary/60 ring-1 ring-primary/40' : 'border-line',
    !coin.active && 'opacity-60',
  )
  if (to) return <Link to={to} className={cls}>{body}</Link>
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cn(cls, 'w-full')}>
      {body}
    </button>
  )
}
