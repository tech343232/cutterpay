import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader, CoinIcon, Segmented } from '@/components/ui/Misc'
import { Skeleton, ErrorState } from '@/components/ui/Feedback'
import { VolumeChart } from '@/components/charts/VolumeChart'
import { ActivityChart } from '@/components/charts/ActivityChart'
import { usd, qty, dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusActions'
import type { ActivityDay, CoinReportRow, TopUser } from '@/types'

function Highlight({ title, icon, coin, amount, count, quantity, tone }: { title: string; icon: React.ReactNode; coin: CoinReportRow; amount: number; count: number; quantity: number; tone: 'primary' | 'pink' }) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border p-6', tone === 'primary' ? 'border-primary/30 bg-primary/10' : 'border-pink/30 bg-pink/10')}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">{title}</span>
        <span className={tone === 'primary' ? 'text-primary' : 'text-pink'}>{icon}</span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <CoinIcon symbol={coin.symbol} color={coin.color} size={52} />
        <div>
          <p className="font-display text-3xl font-bold">{coin.name}</p>
          <p className="tabular text-sm text-muted">
            {usd(amount)} en {count} operaciones · {qty(quantity)} {coin.symbol}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminReports() {
  const [days, setDays] = useState<'7' | '30'>('30')
  const coins = useApi<{ items: CoinReportRow[]; mostBought: CoinReportRow | null; mostSold: CoinReportRow | null }>('/admin/reportes/monedas')
  const top = useApi<{ items: TopUser[] }>('/admin/reportes/top-usuarios?limite=10')
  const activity = useApi<{ items: ActivityDay[] }>(`/admin/reportes/actividad?dias=${days}`)
  const funds = useApi<{ items: { id: number; name: string; color: string; rate: number; investors: number; aum: number; deposits: number; withdrawals: number }[] }>('/admin/reportes/fondos')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reportes" subtitle="Qué se compra, qué se vende y quién opera más." />

      {coins.error ? (
        <ErrorState message={coins.error.message} onRetry={coins.reload} />
      ) : !coins.data ? (
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {coins.data.mostBought && (
              <Highlight title="Moneda más comprada" icon={<TrendingUp className="h-5 w-5" />} coin={coins.data.mostBought} amount={coins.data.mostBought.buyUsd} count={coins.data.mostBought.buys} quantity={coins.data.mostBought.buyQty} tone="primary" />
            )}
            {coins.data.mostSold && (
              <Highlight title="Moneda más vendida" icon={<TrendingDown className="h-5 w-5" />} coin={coins.data.mostSold} amount={coins.data.mostSold.sellUsd} count={coins.data.mostSold.sells} quantity={coins.data.mostSold.sellQty} tone="pink" />
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Volumen por moneda" subtitle="Dólares comprados vs vendidos" />
              <VolumeChart rows={coins.data.items} />
            </Card>
            <Card className="min-w-0">
              <CardHeader title="Detalle por moneda" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                      <th className="py-2.5 pr-3 font-semibold">Moneda</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Compras</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Ventas</th>
                      <th className="py-2.5 text-right font-semibold">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.data.items.map((c) => (
                      <tr key={c.id} className="border-b border-line/60 last:border-0">
                        <td className="py-3 pr-3">
                          <span className="flex items-center gap-2 font-semibold"><CoinIcon symbol={c.symbol} color={c.color} size={24} />{c.symbol}</span>
                        </td>
                        <td className="tabular py-3 pr-3 text-right">{c.buys}<span className="block text-xs text-muted">{usd(c.buyUsd)}</span></td>
                        <td className="tabular py-3 pr-3 text-right">{c.sells}<span className="block text-xs text-muted">{usd(c.sellUsd)}</span></td>
                        <td className="tabular py-3 text-right font-semibold">{usd(c.buyUsd + c.sellUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      <Card className="min-w-0">
        <CardHeader title="Fondos con rendimiento" subtitle="Dinero que los usuarios tienen creciendo en cada fondo" />
        {!funds.data ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-3 pr-4 font-semibold">Fondo</th>
                  <th className="py-3 pr-4 text-right font-semibold">Rendimiento</th>
                  <th className="py-3 pr-4 text-right font-semibold">Inversionistas</th>
                  <th className="py-3 pr-4 text-right font-semibold">Depositado</th>
                  <th className="py-3 pr-4 text-right font-semibold">Retirado</th>
                  <th className="py-3 text-right font-semibold">Valor hoy</th>
                </tr>
              </thead>
              <tbody>
                {funds.data.items.map((f) => (
                  <tr key={f.id} className="border-b border-line/60 last:border-0">
                    <td className="py-3 pr-4"><span className="flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />{f.name}</span></td>
                    <td className="tabular py-3 pr-4 text-right">{f.rate}%</td>
                    <td className="tabular py-3 pr-4 text-right">{f.investors}</td>
                    <td className="tabular py-3 pr-4 text-right">{usd(f.deposits)}</td>
                    <td className="tabular py-3 pr-4 text-right text-muted">{usd(f.withdrawals)}</td>
                    <td className="tabular py-3 text-right font-bold">{usd(f.aum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="min-w-0">
        <CardHeader title="Usuarios con más transacciones" subtitle="Top 10 por número de operaciones" action={<Trophy className="h-5 w-5 text-warn" />} />
        {top.error ? (
          <ErrorState message={top.error.message} onRetry={top.reload} />
        ) : !top.data ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="w-12 py-3 pr-3 font-semibold">#</th>
                  <th className="py-3 pr-4 font-semibold">Usuario</th>
                  <th className="py-3 pr-4 text-right font-semibold">Operaciones</th>
                  <th className="py-3 pr-4 text-right font-semibold">Compras / Ventas</th>
                  <th className="py-3 pr-4 text-right font-semibold">Volumen</th>
                  <th className="py-3 font-semibold">Última</th>
                </tr>
              </thead>
              <tbody>
                {top.data.items.map((u, i) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0">
                    <td className="py-3 pr-3">
                      <span className={cn('grid h-7 w-7 place-items-center rounded-full text-xs font-bold', i === 0 ? 'bg-aurora text-white' : i < 3 ? 'bg-primary/20 text-primary' : 'bg-surface2 text-muted')}>{i + 1}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link to={`/admin/usuarios/${u.id}`} className="font-semibold hover:text-primary">{u.name}</Link>
                      <span className="ml-2"><StatusBadge status={u.status} /></span>
                    </td>
                    <td className="tabular py-3 pr-4 text-right font-bold">{u.txCount}</td>
                    <td className="tabular py-3 pr-4 text-right text-muted">{u.buys} / {u.sells}</td>
                    <td className="tabular py-3 pr-4 text-right">{usd(u.volume)}</td>
                    <td className="py-3 text-muted">{dateTime(u.lastTx)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Volumen diario en dólares"
          action={<Segmented size="sm" value={days} onChange={setDays} options={[{ value: '7', label: '7 días' }, { value: '30', label: '30 días' }]} />}
        />
        {activity.data ? <ActivityChart days={activity.data.items} mode="usd" /> : <Skeleton className="h-64" />}
      </Card>
    </div>
  )
}
