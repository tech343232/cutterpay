import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Receipt } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard, CoinIcon, Pagination } from '@/components/ui/Misc'
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { TransactionList } from '@/components/trade/TransactionList'
import { usd, qty, date, dateTime, signedUsd } from '@/lib/format'
import { StatusActions, StatusBadge } from './StatusActions'
import type { AccountStatus, AuditEntry, Page, Transaction, Wallet } from '@/types'

interface Detail {
  user: { id: number; name: string; email: string; dpi: string | null; role: string; status: AccountStatus; createdAt: string; lastLogin: string | null }
  wallet: Wallet
  transactions: Page<Transaction>
  audit: AuditEntry[]
}

const ACTIONS: Record<string, string> = {
  LOGIN: 'Inició sesión',
  LOGIN_FALLIDO: 'Contraseña incorrecta',
  BLOQUEO_LOGIN: 'Bloqueado por intentos',
  REGISTRO: 'Se registró',
  RECARGA: 'Recargó saldo',
  RECARGA_RECHAZADA: 'Recarga rechazada',
  COMPRA: 'Compró',
  VENTA: 'Vendió',
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi<Detail>(`/admin/usuarios/${id}?page=${page}&pageSize=10`)

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/usuarios" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Usuarios
      </Link>

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : loading || !data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-aurora font-display text-2xl font-bold text-white">{data.user.name[0]}</span>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{data.user.name}</h1>
                <p className="text-sm text-muted">
                  {data.user.email} · Registro {date(data.user.createdAt)}
                  {data.user.dpi && ` · DPI ${data.user.dpi}`}
                </p>
                <div className="mt-2">
                  <StatusBadge status={data.user.status} />
                </div>
              </div>
            </div>
            {data.user.role !== 'admin' && <StatusActions userId={data.user.id} name={data.user.name} status={data.user.status} onChanged={reload} />}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard accent label="Patrimonio" value={usd(data.wallet.totalValue)} />
            <StatCard label="Saldo" value={usd(data.wallet.balance)} />
            <StatCard label="En cripto" value={usd(data.wallet.cryptoValue)} />
            <StatCard label="Ganancia sin vender" value={<span className={data.wallet.unrealized >= 0 ? 'text-ok' : 'text-bad'}>{signedUsd(data.wallet.unrealized)}</span>} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card className="min-w-0">
              <CardHeader title="Historial de movimientos" subtitle={`${data.transactions.total} operaciones`} />
              {data.transactions.items.length === 0 ? (
                <EmptyState icon={<Receipt className="h-6 w-6" />} title="Sin operaciones" text="Este usuario todavía no ha comprado ni vendido." />
              ) : (
                <>
                  <TransactionList items={data.transactions.items} />
                  <Pagination page={data.transactions.page} pages={data.transactions.pages} onChange={setPage} />
                </>
              )}
            </Card>
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader title="Portafolio" />
                {data.wallet.holdings.length === 0 ? (
                  <p className="text-sm text-muted">No tiene monedas.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {data.wallet.holdings.map((h) => (
                      <li key={h.symbol} className="flex items-center gap-3 text-sm">
                        <CoinIcon symbol={h.symbol} color={h.color} size={28} />
                        <span className="flex-1 font-semibold">{qty(h.quantity)} {h.symbol}</span>
                        <span className="tabular">{usd(h.value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <CardHeader title="Auditoría" subtitle="Últimos eventos de la cuenta" />
                <ul className="flex flex-col gap-2.5 text-sm">
                  {data.audit.map((a, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{ACTIONS[a.action] ?? a.action}</span>
                      <span className="text-muted">{dateTime(a.date)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
