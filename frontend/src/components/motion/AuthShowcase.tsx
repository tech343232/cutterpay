import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Gift, MousePointer2 } from 'lucide-react'
import { LogoIcon } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { FloatingArt } from './FloatingArt'

const SCENE_MS = 3800

const SCENES = [
  { kicker: 'Paso 1', title: 'Te damos $1,000 para probar' },
  { kicker: 'Paso 2', title: 'Elige tu moneda digital' },
  { kicker: 'Paso 3', title: 'Compra en dos toques' },
  { kicker: 'Paso 4', title: 'Mira tu dinero moverse en vivo' },
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
        <p className="text-sm font-semibold text-white/80">Saldo de prueba</p>
        <p className="font-display text-4xl font-extrabold">
          <CountUp to={1000} />
        </p>
        <p className="mt-4 text-xs text-white/75">Aprende a invertir sin arriesgar tu dinero</p>
      </div>
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-ok/15 text-ok"><Gift className="h-4 w-4" /></span>
        Tu cuenta está lista en menos de un minuto
      </motion.div>
    </motion.div>
  )
}

const COINS = [
  { name: 'Bitcoin', symbol: 'BTC', glyph: '₿', color: '#F7931A', price: '$68,420' },
  { name: 'Ethereum', symbol: 'ETH', glyph: 'Ξ', color: '#627EEA', price: '$3,512' },
  { name: 'Dogecoin', symbol: 'DOGE', glyph: 'Ð', color: '#C2A633', price: '$0.16' },
]

function CoinDot({ c, size = 34 }: { c: (typeof COINS)[number]; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white" style={{ width: size, height: size, background: c.color, fontSize: size * 0.48 }}>
      {c.glyph}
    </span>
  )
}

function SceneChoose() {
  return (
    <motion.div {...pop} className="relative flex w-full flex-col gap-3">
      {COINS.map((c, i) => (
        <motion.div
          key={c.symbol}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0, scale: i === 0 ? [1, 1, 1.04] : 1, borderColor: i === 0 ? ['rgb(42,37,64)', 'rgb(42,37,64)', 'rgb(155,140,255)'] : 'rgb(42,37,64)' }}
          transition={{ delay: i * 0.15, duration: i === 0 ? 2 : 0.4, times: i === 0 ? [0, 0.7, 1] : undefined }}
          className="flex items-center justify-between rounded-2xl border bg-surface p-3.5"
        >
          <span className="flex items-center gap-3 font-semibold">
            <CoinDot c={c} />
            <span>
              {c.name}
              <span className="block text-xs font-medium text-muted">{c.symbol}</span>
            </span>
          </span>
          <span className="tabular font-display text-lg font-bold">{c.price}</span>
        </motion.div>
      ))}
      <motion.span
        className="absolute text-white drop-shadow"
        initial={{ left: '80%', top: '110%', opacity: 0 }}
        animate={{ left: '70%', top: '12%', opacity: 1, scale: [1, 1, 0.85, 1] }}
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
      <FloatingArt name="shield" size={120} className="-mb-8" />
      <div className="w-full rounded-3xl border border-line bg-surface p-5">
        <p className="flex items-center gap-2 text-sm text-muted"><CoinDot c={COINS[0]} size={22} /> ¿Cuánto Bitcoin quieres?</p>
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
          Confirmar compra
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
      <FloatingArt name="grow" size={130} className="mx-auto -mb-8" />
      <div className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted"><CoinDot c={COINS[0]} size={20} /> Tus $100 en Bitcoin</p>
            <p className="font-display text-4xl font-extrabold text-ok">
              <CountUp from={100} to={108.4} duration={2.4} />
            </p>
          </div>
          <span className="rounded-full bg-ok/15 px-2.5 py-1 text-xs font-bold text-ok">▲ en vivo</span>
        </div>
        <svg viewBox="0 0 300 80" className="mt-3 h-16 w-full" aria-hidden>
          <defs>
            <linearGradient id="grow-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(79,209,165)" stopOpacity=".35" />
              <stop offset="1" stopColor="rgb(79,209,165)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d="M0 62 L30 58 L55 66 L85 48 L110 54 L140 40 L165 46 L195 28 L225 34 L255 18 L300 10 L300 80 L0 80 Z" fill="url(#grow-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} />
          <motion.path d="M0 62 L30 58 L55 66 L85 48 L110 54 L140 40 L165 46 L195 28 L225 34 L255 18 L300 10" fill="none" stroke="rgb(79,209,165)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: 'easeOut' }} />
        </svg>
      </div>
      <p className="rounded-2xl border border-line bg-surface p-3 text-center text-xs text-muted">
        El precio sube y baja durante el día. <b className="text-fg">Tú decides cuándo vender.</b>
      </p>
    </motion.div>
  )
}

const RENDER = [SceneGift, SceneChoose, SceneInvest, SceneGrow]

/** Motion graphic: cuenta en 15 segundos lo fácil que es comprar monedas digitales con CUTTERPAY. */
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
          <p className="font-display text-lg font-bold">Así de fácil es invertir con <span className="text-aurora">CUTTERPAY</span></p>
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
