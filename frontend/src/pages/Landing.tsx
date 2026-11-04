import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Zap, BadgeDollarSign, Eye, TrendingUp, UserPlus, MousePointerClick, Sprout, Moon, Lock, Ban, Check,
} from 'lucide-react'
import { Logo, LogoIcon } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { CoinTicker } from '@/components/trade/CoinTicker'
import { Skeleton } from '@/components/ui/Feedback'
import { BankComparison } from '@/components/funds/BankComparison'
import { LiveMoney } from '@/components/funds/LiveMoney'
import { AuthShowcase } from '@/components/motion/AuthShowcase'
import { useMarket } from '@/hooks/useMarket'
import { useFundCatalog } from '@/hooks/useFunds'
import { usd } from '@/lib/format'

const YEAR = 31536000
const INFLATION = 0.03 // ejemplo para explicar cómo pierde valor el dinero quieto

const PAINS = [
  { icon: Moon, product: 'Cuenta corriente', rate: '0%', text: 'Tu dinero no gana ni un centavo. Solo está guardado.' },
  { icon: TrendingUp, product: 'Cuenta de ahorro', rate: '0.75%', text: 'Gana menos de lo que suben los precios cada año.' },
  { icon: Lock, product: 'Plazo fijo', rate: '3.5%', text: 'Rinde un poco más, pero no lo puedes tocar en 12 meses.' },
]

const BENEFITS = [
  { icon: Sprout, title: 'Gana hasta 9.5% al año', text: 'Más de 10 veces lo que te da una cuenta de ahorro.' },
  { icon: Zap, title: 'Retira cuando quieras', text: 'Sin plazos ni multas. Llega a tu saldo al instante.' },
  { icon: BadgeDollarSign, title: 'Desde $1 y sin comisiones', text: 'No necesitas mucho dinero para empezar.' },
  { icon: Eye, title: 'Míralo crecer cada segundo', text: 'Tu ganancia sube en pantalla mientras haces otras cosas.' },
]

const STEPS = [
  { icon: UserPlus, title: 'Crea tu cuenta', text: 'Toma un minuto. Solo tu nombre, correo y contraseña.' },
  { icon: MousePointerClick, title: 'Elige y confirma', text: 'Escoge un fondo, escribe cuánto y confirma. Como comprar en línea.' },
  { icon: TrendingUp, title: 'Mira cómo crece', text: 'Tu dinero gana un poquito cada segundo. Retíralo cuando quieras.' },
]

export default function Landing() {
  const { coins, loading } = useMarket()
  const catalog = useFundCatalog()
  const best = [...catalog.funds].sort((a, b) => b.rate - a.rate)[0]
  const bestRate = best?.rate ?? 9.5
  const perSecond = (10000 * Math.log(1 + bestRate / 100)) / YEAR
  const sleepy = 1000 / Math.pow(1 + INFLATION, 5)
  const awake = 1000 * Math.pow(1 + bestRate / 100, 5)

  const ticker = [
    ...catalog.funds.map((f) => ({ k: f.name, v: `${f.rate}% al año`, up: true })),
    { k: 'Cuenta de ahorro del banco', v: '0.75% al año', up: false },
    ...coins.map((c) => ({ k: c.name, v: `${usd(c.price, { price: true })} ${c.change24h >= 0 ? '▲' : '▼'} ${Math.abs(c.change24h).toFixed(2)}%`, up: c.change24h >= 0 })),
    { k: 'Comisiones', v: '$0.00', up: true },
  ]

  return (
    <div className="relative overflow-x-hidden">
      {/* Fondo animado */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <span className="cp-blob left-[-120px] top-[-80px] h-[420px] w-[420px] bg-[#C94BE0]" />
        <span className="cp-blob b2 right-[-140px] top-[120px] h-[460px] w-[460px] bg-[#6A4BFF]" />
        <span className="cp-blob b3 left-[35%] top-[420px] h-[320px] w-[320px] bg-[#FF6FB5]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between gap-3 py-5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-fg sm:block">
              Iniciar sesión
            </Link>
            <Link to="/registro">
              <Button size="sm">Crear cuenta</Button>
            </Link>
          </div>
        </header>

        {/* ---------- Héroe ---------- */}
        <section className="grid items-center gap-12 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
          <motion.div initial={{ y: 18 }} animate={{ y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-6">
            <h1 className="text-[2.7rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Haz crecer tu dinero <span className="text-aurora">así de sencillo</span>
            </h1>
            <p className="max-w-lg text-lg text-muted">
              Invierte desde $1 y gana hasta <b className="text-fg">{bestRate}% al año</b> en dólares. Sin comisiones y lo retiras cuando quieras.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/registro">
                <Button size="lg">
                  Crear mi cuenta gratis <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">Ya tengo cuenta</Button>
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {['Desde $1', 'Sin comisiones', 'Retira cuando quieras'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-ok" /> {t}</li>
              ))}
            </ul>
            <div className="w-fit rounded-2xl border border-line bg-surface/70 px-4 py-3 text-sm backdrop-blur">
              Desde que llegaste, <b>$10,000</b> en CUTTERPAY ya ganaron{' '}
              <LiveMoney base={0} perSecond={perSecond} decimals={6} className="font-bold text-ok" />
            </div>
          </motion.div>

          <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative mx-auto w-full max-w-md">
            <div className="relative rounded-4xl bg-surface/85 p-6 shadow-card backdrop-blur">
              <span className="cp-glow-ring" />
              <AuthShowcase />
            </div>
          </motion.div>
        </section>
      </div>

      {/* ---------- Franja en movimiento ---------- */}
      <div className="relative border-y border-line bg-surface/60 py-3 backdrop-blur" aria-label="Rendimientos y precios">
        <div className="cp-marquee">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="mx-6 flex items-center gap-2 whitespace-nowrap text-sm">
              <span className="text-muted">{t.k}</span>
              <b className={t.up ? 'text-ok' : 'text-bad'}>{t.v}</b>
              <span className="ml-6 h-1 w-1 rounded-full bg-line" />
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col px-4 sm:px-6">
        {/* ---------- El problema ---------- */}
        <section className="grid items-center gap-10 py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-bold uppercase tracking-wider text-bad">El problema</p>
            <h2 className="text-3xl font-bold sm:text-5xl">Tu dinero en el banco se está quedando dormido</h2>
            <p className="text-lg text-muted">Y mientras duerme, todo sube de precio. Cada año ese mismo dinero te alcanza para menos.</p>
            <ul className="flex flex-col gap-3">
              {PAINS.map(({ icon: Icon, product, rate, text }) => (
                <li key={product} className="flex items-start gap-4 rounded-3xl border border-line bg-surface p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-bad/10 text-bad"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="font-semibold">{product} <span className="text-bad">· {rate}</span></p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-4xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-sm text-muted">Los mismos <b className="text-fg">$1,000</b> dentro de 5 años</p>

            <div className="rounded-3xl bg-bg/60 p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold"><Ban className="h-4 w-4 text-bad" /> Dormido en el banco</p>
                <span className="relative font-display text-sm font-bold text-muted">
                  <span className="cp-zzz absolute -right-1 -top-4">z</span>
                  <span className="cp-zzz absolute -right-4 -top-6">z</span>
                  <span className="cp-zzz absolute -right-7 -top-8">Z</span>
                </span>
              </div>
              <p className="tabular mt-2 font-display text-3xl font-bold text-bad">Compra como {usd(sleepy)}</p>
              <div className="mt-3 h-3 rounded-full bg-surface2">
                <div className="cp-shrink h-full w-full rounded-full bg-bad/60" />
              </div>
            </div>

            <div className="relative rounded-3xl border border-ok/30 bg-ok/10 p-5">
              <p className="flex items-center gap-2 font-semibold"><Sprout className="h-4 w-4 text-ok" /> Despierto en CUTTERPAY</p>
              <p className="cp-rise tabular mt-2 font-display text-3xl font-bold text-ok">Crece a {usd(awake)}</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface2">
                <motion.div className="h-full rounded-full bg-aurora" initial={{ width: '40%' }} animate={{ width: '100%' }} transition={{ duration: 2.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
              </div>
            </div>
            <p className="text-xs text-muted">Ejemplo si los precios suben 3% al año y tu dinero gana {bestRate}% al año en el fondo Crecimiento.</p>
          </div>
        </section>

        {/* ---------- La solución ---------- */}
        <section className="grid items-start gap-10 py-16 lg:grid-cols-[.9fr_1.1fr]">
          <div className="flex flex-col gap-5 lg:sticky lg:top-10">
            <p className="text-sm font-bold uppercase tracking-wider text-ok">La solución</p>
            <h2 className="text-3xl font-bold sm:text-5xl">Despierta tu dinero con CUTTERPAY</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {BENEFITS.map(({ icon: Icon, title, text }, i) => (
                <motion.li
                  key={title}
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group flex items-start gap-4 rounded-3xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-primary/50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-aurora text-white transition group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="rounded-4xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <LogoIcon size={44} animated />
              <div>
                <p className="font-display text-xl font-bold">Haz la prueba</p>
                <p className="text-sm text-muted">Mueve la barra y compara en dólares</p>
              </div>
            </div>
            {catalog.funds.length ? <BankComparison funds={catalog.funds} rates={catalog.referenceRates} compact /> : <Skeleton className="h-96" />}
          </div>
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <section className="flex flex-col gap-6 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Invertir es tan fácil como comprar en línea</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-3xl border border-line bg-surface p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-surface2">{i + 1}</span>
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-aurora text-white"><Icon className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Cripto ---------- */}
        <section className="flex flex-col gap-6 py-16">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-bold sm:text-4xl">¿Quieres más emoción? También hay cripto</h2>
            <p className="text-muted">Bitcoin, Ethereum y Dogecoin con precios que cambian cada 5 segundos. Compra desde $1, igual de fácil que un fondo.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[112px] rounded-3xl" />) : coins.map((c) => <CoinTicker key={c.symbol} coin={c} to="/registro" />)}
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section className="relative my-12 overflow-hidden rounded-4xl bg-surface px-6 py-14 text-center">
          <span className="cp-glow-ring" />
          <span className="cp-blob left-[10%] top-[-60px] h-56 w-56 bg-[#C94BE0]" />
          <span className="cp-blob b2 right-[5%] bottom-[-80px] h-56 w-56 bg-[#6A4BFF]" />
          <div className="relative flex flex-col items-center gap-5">
            <LogoIcon size={72} animated glow />
            <h2 className="max-w-2xl text-3xl font-bold sm:text-5xl">Tu dinero puede empezar a crecer hoy</h2>
            <p className="max-w-md text-muted">Crea tu cuenta en un minuto y haz tu primera inversión en tres pasos.</p>
            <Link to="/registro">
              <Button size="lg">Crear mi cuenta gratis <ArrowRight className="h-5 w-5" /></Button>
            </Link>
          </div>
        </section>

        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          CUTTERPAY · Proyecto académico de Desarrollo Web, Universidad Mariano Gálvez de Guatemala. Saldos y rendimientos de práctica.
        </footer>
      </div>
    </div>
  )
}
