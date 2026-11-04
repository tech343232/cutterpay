import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const GLYPHS: Record<string, string> = { BTC: '₿', ETH: 'Ξ', DOGE: 'Ð' }

export function CoinIcon({ symbol, color, size = 36 }: { symbol: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.48, boxShadow: `0 6px 18px -6px ${color}` }}
      aria-hidden
    >
      {GLYPHS[symbol] ?? symbol[0]}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold sm:text-[2.1rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, accent, className }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; accent?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-3xl border p-5',
        accent ? 'border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface' : 'border-line bg-surface',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <span className="tabular truncate font-display text-[1.7rem] font-bold leading-tight">{value}</span>
      {sub && <span className="text-sm text-muted">{sub}</span>}
    </div>
  )
}

/** Pestañas tipo "pill" */
export function Segmented<T extends string>({ value, options, onChange, className, size = 'md' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="tablist" className={cn('inline-flex rounded-2xl border border-line bg-bg/60 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-xl font-semibold transition',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            value === o.value ? 'bg-surface2 text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ label, value, onChange, options, id }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-line bg-bg/60 px-3 text-sm text-fg focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm">
      <span className="text-muted">
        Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-xl border border-line px-3 py-1.5 font-semibold disabled:opacity-40 hover:border-primary/50">
          Anterior
        </button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-xl border border-line px-3 py-1.5 font-semibold disabled:opacity-40 hover:border-primary/50">
          Siguiente
        </button>
      </div>
    </div>
  )
}
