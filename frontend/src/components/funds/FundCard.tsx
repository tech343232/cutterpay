import { ArrowRight, Zap, ShieldCheck, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Help } from '@/components/ui/Help'
import { usd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Fund, FundPosition } from '@/types'
import { LiveMoney } from './LiveMoney'

const RISK: Record<Fund['risk'], { label: string; dots: number; color: string; help: string }> = {
  bajo: { label: 'Riesgo bajo', dots: 1, color: 'bg-ok', help: 'Su valor no sube y baja de golpe. Para que tu dinero crezca tranquilo.' },
  medio: { label: 'Riesgo medio', dots: 2, color: 'bg-warn', help: 'En la vida real puede tener meses buenos y malos. Conviene dejarlo más tiempo.' },
  alto: { label: 'Riesgo alto', dots: 3, color: 'bg-bad', help: 'Puede subir o bajar mucho. Solo con dinero que no necesitas pronto.' },
}

/** Anillo que se llena según el rendimiento (escala hasta 10% al año). */
function RateRing({ rate, color }: { rate: number; color: string }) {
  const pct = Math.min(100, (rate / 10) * 100)
  return (
    <div className="relative grid h-36 w-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r="50" fill="none" className="stroke-surface2" strokeWidth="10" />
        <circle
          className="cp-ring"
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
          style={{ ['--pct' as string]: pct, filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="text-center">
        <p className="font-display text-4xl font-extrabold leading-none" style={{ color }}>{rate}%</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">al año</p>
      </div>
    </div>
  )
}

/** Fondo como producto: anillo de rendimiento, ejemplo visual con $100 y chips cortos. */
export function FundCard({ fund, position, bankRate, onInvest, onWithdraw, featured }: { fund: Fund; position?: FundPosition; bankRate: number; onInvest: () => void; onWithdraw?: () => void; featured?: boolean }) {
  const risk = RISK[fund.risk]
  const times = bankRate > 0 ? Math.round(fund.rate / bankRate) : null
  return (
    <article className={cn('group relative flex flex-col items-center gap-5 overflow-hidden rounded-4xl border bg-surface p-6 text-center transition hover:-translate-y-1', featured ? 'border-primary/50 shadow-glow' : 'border-line hover:border-primary/40')}>
      <span aria-hidden className="absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-25 blur-3xl transition group-hover:opacity-40" style={{ background: fund.color }} />
      {featured && <span className="absolute right-4 top-4 rounded-full bg-aurora px-3 py-1 text-xs font-bold text-white">Más elegido</span>}

      {/* Nombre + riesgo */}
      <div className="relative flex flex-col items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-xl font-bold">
          {fund.name}
          <Help title={fund.name}>{fund.description}</Help>
        </h3>
        <span className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span className="flex gap-1">{[1, 2, 3].map((d) => <span key={d} className={cn('h-2 w-4 rounded-full', d <= risk.dots ? risk.color : 'bg-surface2')} />)}</span>
          {risk.label}
          <Help title={risk.label}>{risk.help}</Help>
        </span>
      </div>

      <RateRing rate={fund.rate} color={fund.color} />

      {/* Ejemplo con $100 */}
      <div className="relative flex w-full items-center justify-center gap-3 rounded-3xl bg-bg/60 px-4 py-3">
        <span className="tabular font-display text-xl font-bold text-muted">$100</span>
        <ArrowRight className="cp-nudge h-5 w-5 text-ok" />
        <span className="tabular font-display text-xl font-bold text-ok">{usd(100 + fund.rate)}</span>
        <span className="text-xs text-muted">en 1 año</span>
      </div>

      {/* Ventajas en chips */}
      <div className="relative flex flex-wrap justify-center gap-2 text-xs font-bold">
        <span className="flex items-center gap-1 rounded-full border border-line bg-bg/50 px-3 py-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Sin plazos</span>
        {times && times > 1 && <span className="flex items-center gap-1 rounded-full border border-line bg-bg/50 px-3 py-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> ×{times} vs banco</span>}
        <span className="flex items-center gap-1 rounded-full border border-line bg-bg/50 px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Desde $1</span>
      </div>

      {position && (
        <div className="relative w-full rounded-3xl border border-ok/25 bg-ok/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tienes aquí</p>
          <LiveMoney base={position.value} perSecond={position.perSecond} className="font-display text-2xl font-bold" />
          <p className="text-sm text-ok">+<LiveMoney base={position.gain} perSecond={position.perSecond} /> ganados</p>
        </div>
      )}

      <div className="relative mt-auto flex w-full gap-2">
        <Button className="flex-1" onClick={onInvest} disabled={!fund.active}>
          {position ? 'Agregar' : 'Invertir'}
        </Button>
        {position && onWithdraw && (
          <Button variant="secondary" className="flex-1" onClick={onWithdraw}>
            Retirar
          </Button>
        )}
      </div>
    </article>
  )
}
