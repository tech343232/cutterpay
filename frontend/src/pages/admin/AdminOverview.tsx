import { useState } from 'react'
import { Users, ArrowLeftRight, Landmark, Coins } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader, StatCard, CoinIcon } from '@/components/ui/Misc'
import { Skeleton, ErrorState, Badge, Change } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { ActivityChart } from '@/components/charts/ActivityChart'
import { useMarket } from '@/hooks/useMarket'
import { usd, compactUsd } from '@/lib/format'
import type { AdminSummary, Coin } from '@/types'

export default function AdminOverview() {
  const toast = useToast()
  const summary = useApi<AdminSummary>('/admin/reportes/resumen', { pollMs: 15000 })
  const market = useMarket()
  const [target, setTarget] = useState<Coin | null>(null)
  const [saving, setSaving] = useState(false)

  const toggleCoin = async () => {
    if (!target) return
    setSaving(true)
    try {
      await api(`/admin/monedas/${target.id}`, { method: 'PATCH', body: { active: !target.active } })
      toast({ tone: 'success', title: target.active ? `${target.symbol} pausada` : `${target.symbol} activada`, text: target.active ? 'Nadie podrá comprarla ni venderla hasta que la actives.' : 'Ya se puede operar otra vez.' })
      market.reload()
      setTarget(null)
    } catch (e) {
      toast({ tone: 'error', title: 'No se pudo cambiar la moneda', text: e instanceof ApiError ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const s = summary.data
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Resumen general" subtitle="Balance de toda la plataforma en tiempo real." />

      {summary.error ? (
        <ErrorState message={summary.error.message} onRetry={summary.reload} />
      ) : !s ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard accent label="Usuarios" value={s.users.total} sub={`${s.users.active} activos · ${s.users.suspended} suspendidos · ${s.users.closed} de baja`} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Transacciones" value={s.transactions.total} sub={`${s.transactions.today} hoy · ${s.transactions.buys} compras / ${s.transactions.sells} ventas`} icon={<ArrowLeftRight className="h-4 w-4" />} />
            <StatCard label="Saldo en billeteras" value={compactUsd(s.money.walletUsd)} sub={`Recargado: ${usd(s.money.rechargedUsd)}`} icon={<Landmark className="h-4 w-4" />} />
            <StatCard label="Invertido" value={compactUsd(s.money.cryptoUsd + s.money.fundsUsd)} sub={`Fondos ${compactUsd(s.money.fundsUsd)} · Cripto ${compactUsd(s.money.cryptoUsd)}`} icon={<Coins className="h-4 w-4" />} />
          </div>
          <Card>
            <CardHeader title="Actividad de los últimos 30 días" subtitle="Operaciones de todos los usuarios" />
            <ActivityChart days={s.activity} />
          </Card>
        </>
      )}

      <Card>
        <CardHeader title="Monedas" subtitle="Pausa una moneda para bloquear compras y ventas." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="py-3 pr-4 font-semibold">Moneda</th>
                <th className="py-3 pr-4 text-right font-semibold">Precio</th>
                <th className="py-3 pr-4 text-right font-semibold">24 h</th>
                <th className="py-3 pr-4 font-semibold">Estado</th>
                <th className="py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {market.coins.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <CoinIcon symbol={c.symbol} color={c.color} size={30} />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                  </td>
                  <td className="tabular py-3 pr-4 text-right">{usd(c.price, { price: true })}</td>
                  <td className="py-3 pr-4 text-right"><Change value={c.change24h} /></td>
                  <td className="py-3 pr-4">{c.active ? <Badge tone="ok">Activa</Badge> : <Badge tone="warn">Pausada</Badge>}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => setTarget(c)} className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold hover:border-primary/50">
                      {c.active ? 'Pausar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!target}
        title={target?.active ? `¿Pausar ${target?.name}?` : `¿Activar ${target?.name}?`}
        onClose={() => setTarget(null)}
        onConfirm={toggleCoin}
        loading={saving}
        confirmLabel={target?.active ? 'Pausar moneda' : 'Activar moneda'}
        confirmVariant={target?.active ? 'danger' : 'primary'}
      >
        {target?.active
          ? 'Los usuarios seguirán viendo su saldo en esta moneda, pero no podrán comprar ni vender hasta que la actives.'
          : 'Los usuarios podrán volver a comprar y vender esta moneda.'}
      </Modal>
    </div>
  )
}
