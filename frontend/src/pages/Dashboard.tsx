import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PiggyBank, Bitcoin, Receipt, Wallet as WalletIcon, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useMarket, useWallet } from '@/hooks/useMarket'
import { useApi } from '@/hooks/useApi'
import { useFundCatalog } from '@/hooks/useFunds'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Misc'
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Help } from '@/components/ui/Help'
import { Button } from '@/components/ui/Button'
import { CoinTicker } from '@/components/trade/CoinTicker'
import { TransactionList } from '@/components/trade/TransactionList'
import { PriceChart } from '@/components/charts/PriceChart'
import { LiveMoney } from '@/components/funds/LiveMoney'
import { BankComparison } from '@/components/funds/BankComparison'
import { MoneyFlow, type FlowMode, type FlowTarget } from '@/components/checkout/MoneyFlow'
import { usd, firstName } from '@/lib/format'
import type { Page, PricePoint, Transaction } from '@/types'

type Range = '24h' | '7d'

export default function Dashboard() {
  const { user } = useAuth()
  const market = useMarket()
  const wallet = useWallet()
  const catalog = useFundCatalog()
  const [symbol, setSymbol] = useState('BTC')
  const [range, setRange] = useState<Range>('24h')
  const [flow, setFlow] = useState<{ mode: FlowMode; target: FlowTarget; available: number } | null>(null)
  const history = useApi<{ points: PricePoint[] }>(`/mercado/${symbol}/historial?rango=${range}`, { pollMs: 15000 })
  const recent = useApi<Page<Transaction>>('/transacciones?pageSize=5', { refreshOn: ['cp:wallet-changed'] })

  const w = wallet.data
  const coin = market.coins.find((c) => c.symbol === symbol)
  const buy = (s: string) => {
    const c = market.coins.find((x) => x.symbol === s)
    if (c) setFlow({ mode: 'crypto-buy', target: { key: c.symbol, name: c.name, color: c.color, price: c.price }, available: w?.balance ?? 0 })
  }
  const fixedPart = w ? w.balance + w.cryptoValue : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Héroe: todo tu dinero, creciendo en vivo */}
      <section className="relative overflow-hidden rounded-4xl border border-primary/30 bg-gradient-to-br from-primary/20 via-surface to-surface p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-aurora opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-muted">Hola, <span className="font-semibold text-fg">{firstName(user?.name || '')}</span>. Este es todo tu dinero:</p>
            {wallet.error ? (
              <ErrorState message={wallet.error.message} onRetry={wallet.reload} className="mt-3" />
            ) : !w ? (
              <Skeleton className="mt-2 h-14 w-72" />
            ) : (
              <LiveMoney base={fixedPart + w.funds.value} perSecond={w.funds.perSecond} className="mt-1 block font-display text-5xl font-extrabold sm:text-6xl" />
            )}
            {w && w.funds.perSecond > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ok">
                <Sparkles className="h-4 w-4" /> Tus fondos te dan unos {usd(w.funds.perSecond * 86400)} al día, aunque no hagas nada.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/fondos">
              <Button size="lg"><PiggyBank className="h-5 w-5" /> Invertir en un fondo</Button>
            </Link>
            <Button size="lg" variant="secondary" onClick={() => buy('BTC')} disabled={!w || !market.coins.length}>
              <Bitcoin className="h-5 w-5" /> Comprar cripto
            </Button>
          </div>
        </div>

        {w && (
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link to="/app/billetera" className="rounded-3xl border border-line bg-bg/50 p-4 transition hover:border-primary/40">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><WalletIcon className="h-3.5 w-3.5" /> Disponible</p>
              <p className="tabular mt-1 font-display text-2xl font-bold">{usd(w.balance)}</p>
              <p className="text-xs text-muted">Listo para invertir</p>
            </Link>
            <Link to="/app/fondos" className="rounded-3xl border border-line bg-bg/50 p-4 transition hover:border-primary/40">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><PiggyBank className="h-3.5 w-3.5" /> En fondos</p>
              <LiveMoney base={w.funds.value} perSecond={w.funds.perSecond} className="mt-1 block font-display text-2xl font-bold" />
              <p className="text-xs text-ok">+{usd(w.funds.gain)} ganados</p>
            </Link>
            <Link to="/app/portafolio" className="rounded-3xl border border-line bg-bg/50 p-4 transition hover:border-primary/40">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <Bitcoin className="h-3.5 w-3.5" /> En cripto
                <Help title="Cripto" align="right">Su precio sube y baja durante el día. Puedes ganar más que en un fondo, pero también perder.</Help>
              </p>
              <p className="tabular mt-1 font-display text-2xl font-bold">{usd(w.cryptoValue)}</p>
              <p className={`text-xs ${w.unrealized >= 0 ? 'text-ok' : 'text-bad'}`}>{w.unrealized >= 0 ? '+' : '−'}{usd(Math.abs(w.unrealized))} desde que compraste</p>
            </Link>
          </div>
        )}
      </section>

      {/* Comparación rápida con el banco */}
      {catalog.funds.length > 0 && (
        <Card>
          <CardHeader
            title="¿Cuánto ganarías frente al banco?"
            subtitle="Mueve la barra y compara en dólares"
            action={<Link to="/app/fondos" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver fondos <ArrowRight className="h-4 w-4" /></Link>}
          />
          <BankComparison funds={catalog.funds} rates={catalog.referenceRates} compact />
        </Card>
      )}

      {/* Cripto */}
      <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
        {market.loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[112px] rounded-3xl" />)
          : market.coins.map((c) => <CoinTicker key={c.symbol} coin={c} selected={c.symbol === symbol} onClick={() => setSymbol(c.symbol)} />)}
      </div>
      {market.error && <ErrorState message={market.error.message} onRetry={market.reload} />}

      <Card className="min-w-0">
        <CardHeader
          title={coin ? `${coin.name} (${coin.symbol})` : 'Precio'}
          subtitle={coin ? <>Máx. 24 h {usd(coin.high24h, { price: true })} · Mín. {usd(coin.low24h, { price: true })}</> : null}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<Range> size="sm" value={range} onChange={setRange} options={[{ value: '24h', label: '24 h' }, { value: '7d', label: '7 días' }]} />
              {coin && <Button size="sm" onClick={() => buy(coin.symbol)} disabled={!coin.active}>Comprar {coin.symbol}</Button>}
            </div>
          }
        />
        {history.error ? (
          <ErrorState message={history.error.message} onRetry={history.reload} />
        ) : history.loading || !history.data ? (
          <Skeleton className="h-[280px]" />
        ) : (
          <PriceChart points={history.data.points} range={range} />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Últimos movimientos de cripto"
          action={<Link to="/app/historial" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver todo <ArrowRight className="h-4 w-4" /></Link>}
        />
        {recent.error ? (
          <ErrorState message={recent.error.message} onRetry={recent.reload} />
        ) : recent.loading || !recent.data ? (
          <Skeleton className="h-40" />
        ) : recent.data.items.length === 0 ? (
          <EmptyState icon={<Receipt className="h-6 w-6" />} title="Todavía no compras cripto" text="Puedes empezar con $10. Toca «Comprar cripto» y sigue los 3 pasos." />
        ) : (
          <TransactionList items={recent.data.items} dense />
        )}
      </Card>

      {flow && <MoneyFlow open mode={flow.mode} target={flow.target} available={flow.available} onClose={() => setFlow(null)} />}
    </div>
  )
}
