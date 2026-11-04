import { ShieldCheck, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Feedback'
import { Help } from '@/components/ui/Help'
import { usd } from '@/lib/format'
import type { Fund, FundPosition } from '@/types'
import { LiveMoney } from './LiveMoney'

const RISK: Record<Fund['risk'], { label: string; tone: 'ok' | 'warn' | 'bad'; help: string }> = {
  bajo: { label: 'Riesgo bajo', tone: 'ok', help: 'Su valor no sube y baja de golpe. Es para guardar dinero y que crezca tranquilo.' },
  medio: { label: 'Riesgo medio', tone: 'warn', help: 'En la vida real puede tener meses buenos y meses malos. Conviene dejarlo más tiempo.' },
  alto: { label: 'Riesgo alto', tone: 'bad', help: 'Puede subir mucho o bajar mucho. Solo con dinero que no vas a necesitar pronto.' },
}

/** Fondo presentado como un producto de tienda: cuánto rinde, qué significa en dólares y un botón. */
export function FundCard({ fund, position, bankRate, onInvest, onWithdraw, featured }: { fund: Fund; position?: FundPosition; bankRate: number; onInvest: () => void; onWithdraw?: () => void; featured?: boolean }) {
  const risk = RISK[fund.risk]
  const times = bankRate > 0 ? Math.round(fund.rate / bankRate) : null
  return (
    <article className={`relative flex flex-col gap-4 overflow-hidden rounded-4xl border bg-surface p-6 ${featured ? 'border-primary/50 shadow-glow' : 'border-line'}`}>
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-25 blur-3xl" style={{ background: fund.color }} />
      {featured && <span className="absolute right-5 top-5 rounded-full bg-aurora px-3 py-1 text-xs font-bold text-white">Más elegido</span>}
      <div className="relative flex flex-col gap-1">
        <h3 className="text-xl font-bold">{fund.name}</h3>
        <p className="text-sm text-muted">{fund.description}</p>
      </div>

      <div className="relative">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
          Rendimiento anual
          <Help title="Rendimiento efectivo anual">Es cuánto crece tu dinero en un año, ya contando que lo que ganas también genera ganancias. Aquí crece un poquito cada segundo.</Help>
        </p>
        <p className="font-display text-5xl font-extrabold" style={{ color: fund.color }}>
          {fund.rate}%
        </p>
        <p className="mt-1 text-sm">
          Por cada <b>$100</b> ganas <b className="text-ok">{usd(fund.rate)}</b> al año
        </p>
      </div>

      <ul className="relative flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Retira cuando quieras, sin multas</li>
        <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> {times && times > 1 ? `${times} veces más que el ahorro del banco` : 'Crece todos los días'}</li>
        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Desde $1 y sin comisiones</li>
      </ul>

      <div className="relative flex items-center gap-2">
        <Badge tone={risk.tone}>{risk.label}</Badge>
        <Help title={risk.label} align="left">{risk.help}</Help>
      </div>

      {position && (
        <div className="relative rounded-3xl bg-bg/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tienes aquí</p>
          <LiveMoney base={position.value} perSecond={position.perSecond} className="font-display text-2xl font-bold" />
          <p className="text-sm text-ok">
            +<LiveMoney base={position.gain} perSecond={position.perSecond} /> ganados
          </p>
        </div>
      )}

      <div className="relative mt-auto flex gap-2">
        <Button className="flex-1" onClick={onInvest} disabled={!fund.active}>
          {position ? 'Agregar dinero' : 'Invertir'}
        </Button>
        {position && onWithdraw && (
          <Button variant="secondary" onClick={onWithdraw}>
            Retirar
          </Button>
        )}
      </div>
    </article>
  )
}
