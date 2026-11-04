import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader, StatCard, Segmented } from '@/components/ui/Misc'
import { Skeleton, ErrorState } from '@/components/ui/Feedback'
import { ActivityChart } from '@/components/charts/ActivityChart'
import { VolumeChart } from '@/components/charts/VolumeChart'
import { AllocationChart } from '@/components/charts/AllocationChart'
import { usd, signedUsd } from '@/lib/format'
import { INITIAL_BALANCE } from '@/lib/mock-data'
import type { MyReport } from '@/types'

export default function Reports() {
  const [days, setDays] = useState<'7' | '30'>('30')
  const [mode, setMode] = useState<'count' | 'usd'>('count')
  const { data, error, loading, reload } = useApi<MyReport>(`/reportes/mios?dias=${days}`, { refreshOn: ['cp:wallet-changed'] })

  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (loading || !data) return <Skeleton className="h-96 rounded-3xl" />

  const { wallet: w, totals } = data
  const contributed = INITIAL_BALANCE + totals.recharged
  const overall = w.totalValue - contributed

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mis reportes" subtitle="Balance general y actividad de tu cuenta." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard accent label="Resultado total" value={<span className={overall >= 0 ? 'text-ok' : 'text-bad'}>{signedUsd(overall)}</span>} sub={`Patrimonio vs ${usd(contributed)} recibidos`} />
        <StatCard label="Ganado en fondos" value={<span className="text-ok">{signedUsd(w.funds.gain + totals.fundsRealized)}</span>} sub="Incluye lo que ya retiraste" />
        <StatCard label="Resultado en cripto" value={<span className={totals.realized + w.unrealized >= 0 ? 'text-ok' : 'text-bad'}>{signedUsd(totals.realized + w.unrealized)}</span>} sub={`${signedUsd(totals.realized)} vendido · ${signedUsd(w.unrealized)} sin vender`} />
        <StatCard label="Operaciones cripto" value={totals.count} sub={`${totals.buys} compras · ${totals.sells} ventas`} />
      </div>

      <Card>
        <CardHeader
          title="Actividad por día"
          action={
            <div className="flex flex-wrap gap-2">
              <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: 'count', label: 'Operaciones' }, { value: 'usd', label: 'Dólares' }]} />
              <Segmented size="sm" value={days} onChange={setDays} options={[{ value: '7', label: '7 días' }, { value: '30', label: '30 días' }]} />
            </div>
          }
        />
        <ActivityChart days={data.activity} mode={mode} />
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Volumen por moneda" subtitle="Cuánto has comprado y vendido de cada una" />
          <VolumeChart rows={data.byCoin} />
        </Card>
        <Card>
          <CardHeader title="Balance general" subtitle="Dónde está tu patrimonio hoy" />
          <AllocationChart
            slices={[
              { label: 'Saldo en dólares', value: w.balance, color: 'rgb(90, 84, 120)' },
              ...w.funds.positions.map((f) => ({ label: f.name, value: f.value, color: f.color })),
              ...w.holdings.map((h) => ({ label: h.symbol, value: h.value, color: h.color })),
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
