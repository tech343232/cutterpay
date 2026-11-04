import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Gift, MousePointer2 } from 'lucide-react'
import { LogoIcon } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { FloatingArt } from './FloatingArt'

const SCENE_MS = 3800

const SCENES = [
  { kicker: 'Paso 1', title: 'Te damos $10,000 para practicar' },
  { kicker: 'Paso 2', title: 'Elige dónde quieres que crezca' },
  { kicker: 'Paso 3', title: 'Invierte en dos toques' },
  { kicker: 'Paso 4', title: 'Mira cómo crece cada segundo' },
]

function CountUp({ to, from = 0, duration = 1.6, decimals = 2, prefix = '$' }: { to: number; from?: number; duration?: number; decimals?: number; prefix?: string }) {
  const [v, setV] = useState(from)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000))
      const eased = 1 - Math.pow(1 - p, 3)
      setV(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, from, duration])
  return (
    <span className="tabular">
      {prefix}
      {v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}

const pop = { initial: { opacity: 0, y: 16, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -12, scale: 0.98 } }

function SceneGift() {
  return (
    <motion.div {...pop} className="flex w-full flex-col gap-4">
      <FloatingArt name="gift" size={150} className="mx-auto -mb-8" />
      <div className="relative overflow-hidden rounded-3xl bg-aurora p-5 text-white shadow-glow">
        <motion.div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
        <p className="text-sm font-semibold text-white/80">Saldo para practicar</p>
        <p className="font-display text-4xl font-extrabold">
          <CountUp to={10000} />
        </p>
        <p className="mt-4 text-xs text-white/75">Para empezar sin arriesgar nada</p>
      </div>
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-ok/15 text-ok"><Gift className="h-4 w-4" /></span>
        Tu cuenta está lista en menos de un minuto
      </motion.div>
    </motion.div>
  )
}

const FUNDS = [
  { name: 'Ahorro Flexible', rate: '5.5%', color: '#4FD1A5' },
  { name: 'Meta Plus', rate: '7.25%', color: '#9B8CFF' },
  { name: 'Crecimiento', rate: '9.5%', color: '#FF6FB5' },
]

function SceneChoose() {
  return (
    <motion.div {...pop} className="relative flex w-full flex-col gap-3">
      {FUNDS.map((f, i) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0, scale: i === 1 ? [1, 1, 1.04] : 1, borderColor: i === 1 ? ['rgb(42,37,64)', 'rgb(42,37,64)', 'rgb(155,140,255)'] : 'rgb(42,37,64)' }}
          transition={{ delay: i * 0.15, duration: i === 1 ? 2 : 0.4, times: i === 1 ? [0, 0.7, 1] : undefined }}
          className="flex items-center justify-between rounded-2xl border bg-surface p-4"
        >
          <span className="flex items-center gap-3 font-semibold">
            <span className="h-3 w-3 rounded-full" style={{ background: f.color }} />
            {f.name}
          </span>
          <span className="font-display text-xl font-bold" style={{ color: f.color }}>{f.rate}</span>
        </motion.div>
      ))}
      <motion.span
        className="absolute text-white drop-shadow"
        initial={{ left: '80%', top: '110%', opacity: 0 }}
        animate={{ left: '62%', top: '46%', opacity: 1, scale: [1, 1, 0.85, 1] }}
        transition={{ delay: 0.6, duration: 1.2, scale: { delay: 1.8, duration: 0.3 } }}
      >
        <MousePointer2 className="h-6 w-6 fill-white" />
      </motion.span>
    </motion.div>
  )
}

function SceneInvest() {
  return (
    <motion.div {...pop} className="flex w-full flex-col items-center gap-4">
      <FloatingArt name="shield" size={130} className="-mb-8" />
      <div className="w-full rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">¿Cuánto quieres invertir?</p>
        <p className="font-display text-5xl font-bold">
          <CountUp to={100} duration={0.9} decimals={0} />
        </p>
        <div className="mt-3 flex gap-2 text-xs font-bold text-muted">
          {['$25', '$50', '$100', '$500'].map((c) => (
            <span key={c} className={cn('rounded-xl border px-3 py-1.5', c === '$100' ? 'border-primary bg-primary/15 text-fg' : 'border-line')}>{c}</span>
          ))}
        </div>
      </div>
      <div className="relative w-full">
        <motion.div
          className="w-full rounded-2xl bg-aurora py-3.5 text-center font-semibold text-white shadow-glow"
          animate={{ scale: [1, 1, 0.94, 1] }}
          transition={{ duration: 1.6, times: [0, 0.6, 0.7, 0.8] }}
        >
          Confirmar e invertir
        </motion.div>
        <motion.span
          className="absolute inset-0 m-auto grid h-14 w-14 place-items-center rounded-full bg-ok text-bg shadow-[0_0_40px_rgba(79,209,165,.6)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.35, type: 'spring', stiffness: 300, damping: 14 }}
        >
          <Check className="h-7 w-7" strokeWidth={3} />
        </motion.span>
      </div>
    </motion.div>
  )
}

function SceneGrow() {
  return (
    <motion.div {...pop} className="flex w-full flex-col gap-4">
      <FloatingArt name="grow" size={140} className="mx-auto -mb-8" />
      <div className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Tus $100 en un año</p>
            <p className="font-display text-4xl font-extrabold text-ok">
              <CountUp from={100} to={107.25} duration={2.4} />
            </p>
          </div>
          <span className="rounded-full bg-ok/15 px-2.5 py-1 text-xs font-bold text-ok">+7.25%</span>
        </div>
        <svg viewBox="0 0 300 80" className="mt-3 h-20 w-full" aria-hidden>
          <defs>
            <linearGradient id="grow-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(79,209,165)" stopOpacity=".35" />
              <stop offset="1" stopColor="rgb(79,209,165)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d="M0 72 C 50 68, 90 62, 140 50 S 230 22, 300 8 L300 80 L0 80 Z" fill="url(#grow-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} />
          <motion.path d="M0 72 C 50 68, 90 62, 140 50 S 230 22, 300 8" fill="none" stroke="rgb(79,209,165)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: 'easeOut' }} />
        </svg>
      </div>
      <div className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-4 text-sm">
        {[
          { l: 'CUTTERPAY', v: '+$7.25', w: '100%', c: 'bg-aurora' },
          { l: 'Ahorro en el banco', v: '+$0.75', w: '10%', c: 'bg-[rgb(90,84,120)]' },
        ].map((r, i) => (
          <div key={r.l} className="flex flex-col gap-1">
            <div className="flex justify-between"><span className={i ? 'text-muted' : 'font-semibold'}>{r.l}</span><b className={i ? '' : 'text-ok'}>{r.v}</b></div>
            <div className="h-2.5 rounded-full bg-surface2">
              <motion.div className={cn('h-full rounded-full', r.c)} initial={{ width: 0 }} animate={{ width: r.w }} transition={{ delay: 0.6 + i * 0.2, duration: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const RENDER = [SceneGift, SceneChoose, SceneInvest, SceneGrow]

/** Motion graphic de login/registro: cuenta en 15 segundos lo fácil que es invertir con CUTTERPAY. */
export function AuthShowcase({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(reduce ? 3 : 0)

  useEffect(() => {
    if (reduce) return
    const id = setTimeout(() => setI((n) => (n + 1) % SCENES.length), SCENE_MS)
    return () => clearTimeout(id)
  }, [i, reduce])

  const Scene = RENDER[i]
  return (
    <div className={cn('flex w-full flex-col gap-5', compact ? 'max-w-sm' : 'max-w-md')}>
      {!compact && (
        <div className="flex items-center gap-3">
          <LogoIcon size={48} animated glow />
          <p className="font-display text-lg font-bold">Así de fácil es crecer con <span className="text-aurora">CUTTERPAY</span></p>
        </div>
      )}
      <div className="flex gap-1.5" aria-hidden>
        {SCENES.map((_, n) => (
          <button key={n} type="button" tabIndex={-1} onClick={() => setI(n)} className="h-1 flex-1 overflow-hidden rounded-full bg-surface2">
            {n < i && <span className="block h-full w-full bg-primary" />}
            {n === i && <motion.span key={`p${i}`} className="block h-full bg-aurora" initial={{ width: reduce ? '100%' : 0 }} animate={{ width: '100%' }} transition={{ duration: SCENE_MS / 1000, ease: 'linear' }} />}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div key={`t${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{SCENES[i].kicker}</p>
            <p className={cn('font-display font-extrabold leading-tight', compact ? 'text-2xl' : 'text-3xl')}>{SCENES[i].title}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={cn('relative flex items-start', compact ? 'min-h-[330px]' : 'min-h-[470px]')}>
        <AnimatePresence mode="wait">
          <Scene key={i} />
        </AnimatePresence>
      </div>
    </div>
  )
}
