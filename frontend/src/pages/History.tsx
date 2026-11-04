import { useState } from 'react'
import { History as HistoryIcon } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { Card } from '@/components/ui/Card'
import { PageHeader, Select, Pagination, Segmented } from '@/components/ui/Misc'
import { usd, dateTime } from '@/lib/format'
import type { FundMovement } from '@/types'
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { TransactionList } from '@/components/trade/TransactionList'
import type { Page, Transaction } from '@/types'

export default function History() {
  const [tab, setTab] = useState<'cripto' | 'fondos'>('cripto')
  const moves = useApi<{ items: FundMovement[] }>(tab === 'fondos' ? '/fondos/movimientos' : null, { refreshOn: ['cp:wallet-changed'] })
  const [tipo, setTipo] = useState('')
  const [cripto, setCripto] = useState('')
  const [page, setPage] = useState(1)
  const qs = new URLSearchParams({ tipo, cripto, page: String(page), pageSize: '12' }).toString()
  const { data, error, loading, reload } = useApi<Page<Transaction>>(`/transacciones?${qs}`, { refreshOn: ['cp:wallet-changed'] })

  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Historial" subtitle="Todo lo que has hecho con tu dinero." actions={<Segmented value={tab} onChange={setTab} options={[{ value: 'cripto', label: 'Cripto' }, { value: 'fondos', label: 'Fondos' }]} />} />
      {tab === 'fondos' ? (
        <Card>
          {!moves.data ? (
            <Skeleton className="h-60" />
          ) : moves.data.items.length === 0 ? (
            <EmptyState icon={<HistoryIcon className="h-6 w-6" />} title="Aún no usas los fondos" text="Cuando inviertas o retires dinero de un fondo, aparecerá aquí." />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {moves.data.items.map((mv) => (
                <li key={mv.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: mv.color }} />
                    <div>
                      <p className="font-semibold">{mv.type === 'deposito' ? 'Invertiste en' : 'Retiraste de'} {mv.fund}</p>
                      <p className="text-xs text-muted">{dateTime(mv.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`tabular font-semibold ${mv.type === 'retiro' ? 'text-ok' : ''}`}>{mv.type === 'deposito' ? '−' : '+'}{usd(mv.amount)}</p>
                    {mv.gain != null && mv.gain > 0 && <p className="tabular text-xs text-ok">{usd(mv.gain)} de ganancia</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <Select
            id="f-tipo"
            label="Tipo"
            value={tipo}
            onChange={filter(setTipo)}
            options={[
              { value: '', label: 'Compras y ventas' },
              { value: 'compra', label: 'Solo compras' },
              { value: 'venta', label: 'Solo ventas' },
            ]}
          />
          <Select
            id="f-cripto"
            label="Moneda"
            value={cripto}
            onChange={filter(setCripto)}
            options={[
              { value: '', label: 'Todas' },
              { value: 'BTC', label: 'Bitcoin' },
              { value: 'ETH', label: 'Ethereum' },
              { value: 'SOL', label: 'Solana' },
            ]}
          />
        </div>
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : loading || !data ? (
          <Skeleton className="h-80" />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="h-6 w-6" />}
            title={tipo || cripto ? 'Nada con esos filtros' : 'Aún no hay operaciones'}
            text={tipo || cripto ? 'Prueba quitando un filtro.' : 'Cuando compres o vendas, cada operación aparecerá aquí con fecha y precio.'}
          />
        ) : (
          <>
            <TransactionList items={data.items} />
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </Card>
      )}
    </div>
  )
}
