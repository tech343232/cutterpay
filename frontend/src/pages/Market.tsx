import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMarket, useWallet } from '@/hooks/useMarket'
import { useApi } from '@/hooks/useApi'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader, Segmented, CoinIcon } from '@/components/ui/Misc'
import { Skeleton, ErrorState, Change, Badge } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { MoneyFlow, type FlowMode } from '@/components/checkout/MoneyFlow'
import { PriceChart } from '@/components/charts/PriceChart'
import { usd, qty, signedUsd, pct, time } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PricePoint } from '@/types'

type Range = '24h' | '7d'

export default function Market() {
  const { symbol: param } = useParams()
  const navigate = useNavigate()
  const symbol = (param || 'BTC').toUpperCase()
  const market = useMarket()
  const wallet = useWallet()
  const [range, setRange] = useState<Range>('24h')
  const [flow, setFlow] = useState<FlowMode | null>(null)
  const history = useApi<{ points: PricePoint[] }>(`/mercado/${symbol}/historial?rango=${range}`, { pollMs: 15000 })

  const coin = market.coins.find((c) => c.symbol === symbol)
  const pos = wallet.data?.holdings.find((h) => h.symbol === symbol)
  const go = (s: string) => navigate(`/app/mercado/${s}`)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cripto" subtitle="Precios que cambian cada 5 segundos. Compra desde $1, como en cualquier tienda en línea." />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {market.coins.map((c) => (
          <button
            key={c.symbol}
            onClick={() => go(c.symbol)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 font-bold transition',
              c.symbol === symbol ? 'border-primary bg-primary/10' : 'border-line bg-surface hover:border-primary/40',
            )}
          >
            <CoinIcon symbol={c.symbol} color={c.color} size={24} />
            {c.name}
            <Change value={c.change24h} className="text-xs" />
          </button>
        ))}
      </div>

      {market.error && <ErrorState message={market.error.message} onRetry={market.reload} />}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            {!coin ? (
              market.loading ? <Skeleton className="h-24" /> : <ErrorState message="Esa moneda no existe en CUTTERPAY." />
            ) : (
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CoinIcon symbol={coin.symbol} color={coin.color} size={52} />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                      {coin.name} · {coin.symbol} {!coin.active && <Badge tone="warn">Pausada</Badge>}
                    </p>
                    <p key={coin.price} className="tabular animate-flash rounded-lg font-display text-4xl font-bold">{usd(coin.price, { price: true })}</p>
                    <p className="mt-1 text-sm">
                      <Change value={coin.change24h} /> <span className="text-muted">en 24 h · actualizado {time(coin.updatedAt)}</span>
                    </p>
                  </div>
                </div>
                <Segmented<Range>
                  size="sm"
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: '24h', label: '24 h' },
                    { value: '7d', label: '7 días' },
                  ]}
                />
              </div>
            )}
            {history.error ? (
              <ErrorState message={history.error.message} onRetry={history.reload} />
            ) : history.loading || !history.data ? (
              <Skeleton className="h-[340px]" />
            ) : (
              <PriceChart points={history.data.points} range={range} height={340} />
            )}
          </Card>

          {coin && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Apertura 24 h', usd(coin.open24h, { price: true })],
                ['Máximo 24 h', usd(coin.high24h, { price: true })],
                ['Mínimo 24 h', usd(coin.low24h, { price: true })],
                ['Variación', pct(coin.change24h)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</p>
                  <p className="tabular mt-1 font-display text-lg font-bold">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={coin ? `${coin.name} en 3 pasos` : 'Comprar'} subtitle="Elige el monto en dólares, revisa y listo." />
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => setFlow('crypto-buy')} disabled={!coin?.active || !wallet.data}>
                Comprar {symbol}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setFlow('crypto-sell')} disabled={!coin?.active || !pos}>
                Vender {symbol}
              </Button>
              <p className="text-sm text-muted">
                Disponible: <b className="tabular text-fg">{usd(wallet.data?.balance ?? 0)}</b>. Sin comisiones.
              </p>
              {coin && !coin.active && <p className="text-sm font-semibold text-warn">El administrador pausó esta moneda por ahora.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Tu posición" />
            {pos ? (
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted">Cantidad</dt>
                <dd className="tabular text-right font-semibold">{qty(pos.quantity)} {pos.symbol}</dd>
                <dt className="text-muted">Costo promedio</dt>
                <dd className="tabular text-right font-semibold">{usd(pos.avgCost, { price: true })}</dd>
                <dt className="text-muted">Valor actual</dt>
                <dd className="tabular text-right font-semibold">{usd(pos.value)}</dd>
                <dt className="text-muted">Ganancia</dt>
                <dd className={cn('tabular text-right font-bold', pos.pnl >= 0 ? 'text-ok' : 'text-bad')}>
                  {signedUsd(pos.pnl)} ({pct(pos.pnlPct)})
                </dd>
              </dl>
            ) : (
              <p className="text-sm text-muted">Aún no tienes {symbol}. Cuando compres, aquí verás cuánto tienes y cuánto vas ganando.</p>
            )}
          </Card>
        </div>
      </div>
      {flow && coin && (
        <MoneyFlow
          open
          mode={flow}
          target={{ key: coin.symbol, name: coin.name, color: coin.color, price: coin.price }}
          available={flow === 'crypto-buy' ? wallet.data?.balance ?? 0 : pos?.value ?? 0}
          onClose={() => setFlow(null)}
        />
      )}
    </div>
  )
}
