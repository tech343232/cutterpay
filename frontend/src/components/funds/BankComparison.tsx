import { useState } from 'react'
import { motion } from 'framer-motion'
import { usd } from '@/lib/format'
import { Help } from '@/components/ui/Help'
import { cn } from '@/lib/utils'
import type { Fund, ReferenceRate } from '@/types'

const PERIODS = [
  { months: 6, label: '6 meses' },
  { months: 12, label: '1 año' },
  { months: 24, label: '2 años' },
  { months: 60, label: '5 años' },
]

interface Row {
  label: string
  rate: number
  color: string
  note?: string
  gain: number
}

/**
 * Comparador ordenado en 3 bloques: 1) qué y cuánto tiempo, 2) el resultado en grande,
 * 3) el detalle separado en "CUTTERPAY" y "Banco tradicional".
 */
export function BankComparison({ funds, rates, compact }: { funds: Fund[]; rates: ReferenceRate[]; compact?: boolean }) {
  const [amount, setAmount] = useState(1000)
  const [months, setMonths] = useState(12)
  const years = months / 12
  const gainOf = (rate: number) => amount * (Math.pow(1 + rate / 100, years) - 1)

  const ours: Row[] = [...funds].sort((a, b) => b.rate - a.rate).map((f) => ({ label: f.name, rate: f.rate, color: f.color, gain: gainOf(f.rate) }))
  const bank: Row[] = rates.map((r) => ({ label: r.product, rate: r.rate, color: 'rgb(90, 84, 120)', note: r.note, gain: gainOf(r.rate) }))
  const max = Math.max(...ours.map((r) => r.gain), ...bank.map((r) => r.gain), 1)
  const best = ours[0]
  const savings = bank.find((r) => r.label.toLowerCase().includes('ahorro'))
  const times = best && savings && savings.gain > 0 ? Math.round(best.gain / savings.gain) : null
  const period = PERIODS.find((p) => p.months === months)!.label

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Monto y tiempo */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="cmp-amount" className="text-sm font-semibold text-muted">Si inviertes</label>
          <span className="tabular font-display text-3xl font-bold">{usd(amount)}</span>
        </div>
        <input
          id="cmp-amount"
          type="range"
          min={100}
          max={20000}
          step={100}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-[rgb(201,75,224)]"
          aria-label="Monto a invertir"
        />
        <div role="radiogroup" aria-label="Durante cuánto tiempo" className="grid grid-cols-4 gap-1 rounded-2xl border border-line bg-bg/60 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.months}
              type="button"
              role="radio"
              aria-checked={months === p.months}
              onClick={() => setMonths(p.months)}
              className={cn(
                'whitespace-nowrap rounded-xl px-1 py-2 text-[13px] font-bold transition',
                months === p.months ? 'bg-surface2 text-fg ring-1 ring-primary/50' : 'text-muted hover:text-fg',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. El resultado en grande */}
      {best && (
        <div className="relative overflow-hidden rounded-3xl border border-ok/25 bg-ok/10 p-5">
          <p className="text-sm text-muted">En {period} con {best.label} tendrías</p>
          <motion.p key={`${amount}-${months}`} initial={{ scale: 0.96, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="tabular font-display text-4xl font-extrabold text-ok">
            {usd(amount + best.gain)}
          </motion.p>
          <p className="mt-1 text-sm">
            Ganas <b className="text-ok">{usd(best.gain)}</b>
            {times && times > 1 && <> · <b>{times} veces más</b> que en una cuenta de ahorro</>}
          </p>
        </div>
      )}

      {/* 3. Detalle en dos grupos */}
      <Group title="CUTTERPAY" rows={ours} max={max} highlight compact={compact} />
      <Group title="Banco tradicional" rows={bank} max={max} compact={compact} />

      {!compact && <p className="text-xs text-muted">Tasas bancarias: referencias aproximadas en dólares para comparar.</p>}
    </div>
  )
}

function Group({ title, rows, max, highlight, compact }: { title: string; rows: Row[]; max: number; highlight?: boolean; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className={cn('text-xs font-bold uppercase tracking-wider', highlight ? 'text-primary' : 'text-muted')}>{title}</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <li key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className={cn('flex min-w-0 items-center gap-1.5 text-sm', highlight ? 'font-semibold' : 'text-muted')}>
              <span className="truncate">{r.label}</span>
              {r.note && !compact && <Help align="left">{r.note}</Help>}
            </span>
            <span className="tabular whitespace-nowrap text-sm">
              <span className="text-muted">{r.rate}%</span> <b className={highlight ? 'text-ok' : ''}>+{usd(r.gain)}</b>
            </span>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: r.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(1.5, (r.gain / max) * 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
