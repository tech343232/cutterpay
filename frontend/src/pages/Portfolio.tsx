import { Link } from 'react-router-dom'
import { PieChart } from 'lucide-react'
import { useWallet } from '@/hooks/useMarket'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader, StatCard, CoinIcon } from '@/components/ui/Misc'
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { AllocationChart } from '@/components/charts/AllocationChart'
import { usd, qty, signedUsd, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Portfolio() {
  const { data: w, error, loading, reload } = useWallet()

  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (loading || !w) return <Skeleton className="h-96 rounded-3xl" />

  const slices = [
    { label: 'Saldo en dólares', value: w.balance, color: 'rgb(90, 84, 120)' },
    ...w.funds.positions.map((f) => ({ label: `Fondo ${f.name}`, value: f.value, color: f.color })),
    ...w.holdings.map((h) => ({ label: `${h.name} (${h.symbol})`, value: h.value, color: h.color })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Portafolio" subtitle="Todo lo que tienes: saldo, fondos y cripto." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard accent label="Patrimonio" value={usd(w.totalValue)} />
        <StatCard label="En fondos" value={usd(w.fundsValue)} sub={<span className="text-ok">+{usd(w.funds.gain)} ganados</span>} />
        <StatCard label="En cripto" value={usd(w.cryptoValue)} sub={`Te costó ${usd(w.invested)}`} />
        <StatCard
          label="Cripto sin vender"
          value={<span className={w.unrealized >= 0 ? 'text-ok' : 'text-bad'}>{signedUsd(w.unrealized)}</span>}
          sub={w.invested ? pct((w.unrealized / w.invested) * 100) : '—'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card className="min-w-0">
          <CardHeader title="Tus criptomonedas" />
          {w.holdings.length === 0 ? (
            <EmptyState
              icon={<PieChart className="h-6 w-6" />}
              title="Tu portafolio está vacío"
              text="Compra tu primera moneda y aquí verás su valor en tiempo real."
              action={
                <Link to="/app/mercado">
                  <Button size="sm">Ir al mercado</Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="py-3 pr-4 font-semibold">Moneda</th>
                    <th className="py-3 pr-4 text-right font-semibold">Cantidad</th>
                    <th className="py-3 pr-4 text-right font-semibold">Costo prom.</th>
                    <th className="py-3 pr-4 text-right font-semibold">Precio</th>
                    <th className="py-3 pr-4 text-right font-semibold">Valor</th>
                    <th className="py-3 text-right font-semibold">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {w.holdings.map((h) => (
                    <tr key={h.symbol} className="border-b border-line/60 last:border-0">
                      <td className="py-3.5 pr-4">
                        <Link to={`/app/mercado/${h.symbol}`} className="flex items-center gap-3 hover:text-primary">
                          <CoinIcon symbol={h.symbol} color={h.color} size={32} />
                          <span className="font-semibold">{h.name}</span>
                        </Link>
                      </td>
                      <td className="tabular py-3.5 pr-4 text-right">{qty(h.quantity)} {h.symbol}</td>
                      <td className="tabular py-3.5 pr-4 text-right text-muted">{usd(h.avgCost, { price: true })}</td>
                      <td className="tabular py-3.5 pr-4 text-right">{usd(h.price, { price: true })}</td>
                      <td className="tabular py-3.5 pr-4 text-right font-semibold">{usd(h.value)}</td>
                      <td className={cn('tabular py-3.5 text-right font-semibold', h.pnl >= 0 ? 'text-ok' : 'text-bad')}>
                        {signedUsd(h.pnl)}
                        <span className="block text-xs font-normal">{pct(h.pnlPct)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Distribución" subtitle="Cómo está repartido tu dinero" />
          <AllocationChart slices={slices} />
        </Card>
      </div>
    </div>
  )
}
