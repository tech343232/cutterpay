import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { CoinIcon } from '@/components/ui/Misc'
import { usd, qty, dateTime, signedUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

/** Tabla en escritorio, tarjetas en celular. */
export function TransactionList({ items, dense }: { items: Transaction[]; dense?: boolean }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-3 pr-4 font-semibold">Operación</th>
              <th className="py-3 pr-4 font-semibold">Fecha</th>
              <th className="py-3 pr-4 text-right font-semibold">Cantidad</th>
              <th className="py-3 pr-4 text-right font-semibold">Precio</th>
              <th className="py-3 pr-4 text-right font-semibold">Total</th>
              {!dense && <th className="py-3 text-right font-semibold">Ganancia</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-line/60 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <CoinIcon symbol={t.symbol} color={t.color} size={30} />
                    <div>
                      <p className="font-semibold">{t.type === 'compra' ? 'Compra' : 'Venta'} {t.symbol}</p>
                      <p className="text-xs text-muted">{t.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted">{dateTime(t.date)}</td>
                <td className="tabular py-3 pr-4 text-right">{qty(t.quantity)}</td>
                <td className="tabular py-3 pr-4 text-right text-muted">{usd(t.price, { price: true })}</td>
                <td className={cn('tabular py-3 pr-4 text-right font-semibold', t.type === 'compra' ? 'text-fg' : 'text-ok')}>
                  {t.type === 'compra' ? '−' : '+'}
                  {usd(t.total)}
                </td>
                {!dense && (
                  <td className={cn('tabular py-3 text-right', t.gain == null ? 'text-muted' : t.gain >= 0 ? 'text-ok' : 'text-bad')}>
                    {t.gain == null ? '—' : signedUsd(t.gain)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-bg/50 p-3">
            <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', t.type === 'compra' ? 'bg-primary/15 text-primary' : 'bg-pink/15 text-pink')}>
              {t.type === 'compra' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {t.type === 'compra' ? 'Compra' : 'Venta'} {qty(t.quantity)} {t.symbol}
              </p>
              <p className="text-xs text-muted">{dateTime(t.date)} · {usd(t.price, { price: true })}</p>
            </div>
            <div className="text-right">
              <p className={cn('tabular text-sm font-bold', t.type === 'venta' && 'text-ok')}>
                {t.type === 'compra' ? '−' : '+'}
                {usd(t.total)}
              </p>
              {t.gain != null && <p className={cn('tabular text-xs', t.gain >= 0 ? 'text-ok' : 'text-bad')}>{signedUsd(t.gain)}</p>}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
