import { useState } from 'react'
import { PiggyBank, Sparkles } from 'lucide-react'
import { useFundCatalog, useMyFunds } from '@/hooks/useFunds'
import { useWallet } from '@/hooks/useMarket'
import { useApi } from '@/hooks/useApi'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/Misc'
import { Skeleton, ErrorState, EmptyState, Badge } from '@/components/ui/Feedback'
import { FundCard } from '@/components/funds/FundCard'
import { BankComparison } from '@/components/funds/BankComparison'
import { LiveMoney } from '@/components/funds/LiveMoney'
import { MoneyFlow, type FlowMode, type FlowTarget } from '@/components/checkout/MoneyFlow'
import { usd, dateTime } from '@/lib/format'
import type { Fund, FundMovement } from '@/types'

export default function Funds() {
  const catalog = useFundCatalog()
  const mine = useMyFunds()
  const wallet = useWallet()
  const moves = useApi<{ items: FundMovement[] }>('/fondos/movimientos', { refreshOn: ['cp:wallet-changed'] })
  const [flow, setFlow] = useState<{ mode: FlowMode; target: FlowTarget; available: number } | null>(null)

  const positionOf = (f: Fund) => mine.data?.positions.find((p) => p.slug === f.slug)
  const open = (mode: FlowMode, f: Fund) =>
    setFlow({
      mode,
      target: { key: f.slug, name: f.name, color: f.color, rate: f.rate },
      available: mode === 'fund-invest' ? wallet.data?.balance ?? 0 : positionOf(f)?.value ?? 0,
    })

  const m = mine.data
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Fondos" subtitle="Pon tus dólares a crecer todos los días. Sin plazos, sin comisiones y desde $1." />

      {/* Resumen en vivo */}
      <div className="relative overflow-hidden rounded-4xl border border-primary/30 bg-gradient-to-br from-primary/20 via-surface to-surface p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-aurora opacity-20 blur-3xl" />
        {mine.loading || !m ? (
          <Skeleton className="h-24" />
        ) : m.positions.length === 0 ? (
          <div className="relative flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Tu primer paso</p>
            <p className="max-w-xl font-display text-2xl font-bold">Elige un fondo abajo y mira cómo tu dinero empieza a crecer en este mismo segundo.</p>
          </div>
        ) : (
          <div className="relative grid gap-6 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-muted">Tu dinero en fondos</p>
              <LiveMoney base={m.value} perSecond={m.perSecond} className="font-display text-4xl font-extrabold sm:text-5xl" />
              <p className="mt-2 text-sm">
                Has ganado <LiveMoney base={m.gain} perSecond={m.perSecond} className="font-bold text-ok" /> sin hacer nada.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-1 text-sm sm:items-end">
              <Badge tone="ok"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> Creciendo ahora</Badge>
              <p className="text-muted">
                Ganas unos <b className="text-fg">{usd(m.perSecond * 86400)}</b> al día
              </p>
            </div>
          </div>
        )}
      </div>

      {catalog.error && <ErrorState message={catalog.error.message} onRetry={catalog.reload} />}
      <div className="grid gap-5 lg:grid-cols-3">
        {catalog.loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[520px] rounded-4xl" />)
          : catalog.funds.map((f, i) => (
              <FundCard
                key={f.id}
                fund={f}
                featured={i === 1}
                position={positionOf(f)}
                bankRate={catalog.bankRate}
                onInvest={() => open('fund-invest', f)}
                onWithdraw={() => open('fund-withdraw', f)}
              />
            ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader title="¿Dónde crece más tu dinero?" subtitle="Compara en dólares con lo que te da un banco tradicional" />
          {catalog.funds.length > 0 && <BankComparison funds={catalog.funds} rates={catalog.referenceRates} />}
        </Card>
        <Card>
          <CardHeader title="Tus movimientos" />
          {moves.loading || !moves.data ? (
            <Skeleton className="h-40" />
          ) : moves.data.items.length === 0 ? (
            <EmptyState icon={<PiggyBank className="h-6 w-6" />} title="Aún no inviertes en fondos" text="Cuando inviertas o retires, lo verás aquí." className="py-6" />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {moves.data.items.slice(0, 8).map((mv) => (
                <li key={mv.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: mv.color }} />
                    <div>
                      <p className="font-semibold">{mv.type === 'deposito' ? 'Invertiste en' : 'Retiraste de'} {mv.fund}</p>
                      <p className="text-xs text-muted">{dateTime(mv.date)}</p>
                    </div>
                  </div>
                  <span className={`tabular font-semibold ${mv.type === 'retiro' ? 'text-ok' : ''}`}>
                    {mv.type === 'deposito' ? '−' : '+'}
                    {usd(mv.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {flow && (
        <MoneyFlow open mode={flow.mode} target={flow.target} available={flow.available} bankRate={catalog.bankRate} onClose={() => setFlow(null)} />
      )}
    </div>
  )
}
