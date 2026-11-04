import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Moon, TrendingUp, Lock, Ban, Check, ShoppingBag, Zap, Gift, ShieldCheck, UserPlus, MousePointerClick, Activity,
} from 'lucide-react'
import { Logo, LogoIcon } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Skeleton, Change } from '@/components/ui/Feedback'
import { CoinIcon } from '@/components/ui/Misc'
import { Sparkline } from '@/components/charts/Sparkline'
import { AuthShowcase } from '@/components/motion/AuthShowcase'
import { useMarket } from '@/hooks/useMarket'
import { usd, qty } from '@/lib/format'

const INFLATION = 0.03 // ejemplo para explicar cómo pierde valor el dinero quieto

/** Explicación en palabras simples de las 3 monedas del proyecto */
const ABOUT: Record<string, { text: string; moves: string; tone: string }> = {
  BTC: {
    text: 'La primera moneda digital, creada en 2009 por Satoshi Nakamoto. Es la más conocida del mundo. No necesitas comprar una entera: puedes comprar un pedacito desde $1.',
    moves: 'Se mueve poco',
    tone: 'text-ok border-ok/30 bg-ok/10',
  },
  ETH: {
    text: 'La segunda más grande. Además de ser moneda, es una red donde funcionan miles de aplicaciones. Muchos la eligen para hacer crecer su dinero a largo plazo.',
    moves: 'Se mueve más',
    tone: 'text-warn border-warn/30 bg-warn/10',
  },
  DOGE: {
    text: 'Nació en 2013 como una broma con la imagen de un perro y hoy es de las más populares. Cada moneda cuesta centavos: con $1 ya tienes varias.',
    moves: 'Se mueve mucho',
    tone: 'text-bad border-bad/30 bg-bad/10',
  },
}

const PAINS = [
  { icon: Moon, product: 'Cuenta corriente', rate: '0%', text: 'Tu dinero no gana ni un centavo. Solo está guardado.' },
  { icon: TrendingUp, product: 'Cuenta de ahorro', rate: '0.75%', text: 'Gana menos de lo que suben los precios cada año.' },
  { icon: Lock, product: 'Plazo fijo', rate: '3.5%', text: 'Rinde un poco más, pero no lo puedes tocar en 12 meses.' },
]

const BENEFITS = [
  { icon: ShoppingBag, title: 'Comprar es como una tienda en línea', text: 'Eliges la moneda, escribes cuánto en dólares y confirmas. Listo.' },
  { icon: Zap, title: 'Desde $1 y sin comisiones', text: 'No necesitas mucho dinero para empezar a invertir.' },
  { icon: Activity, title: 'Precios en vivo cada 5 segundos', text: 'Mira cómo se mueve tu dinero y vende cuando tú quieras.' },
  { icon: Gift, title: '$10,000 para practicar', text: 'Aprende sin miedo antes de arriesgar tu propio dinero.' },
  { icon: ShieldCheck, title: 'Protegido con código', text: 'Cada compra y venta se confirma con un código que llega a tu correo.' },
]

const STEPS = [
  { icon: UserPlus, title: 'Crea tu cuenta', text: 'En un minuto, con tu nombre, correo y contraseña. Recibes $10,000 para practicar.' },
  { icon: MousePointerClick, title: 'Elige tu moneda', text: 'Bitcoin, Ethereum o Dogecoin. Escribe cuánto quieres en dólares y confirma.' },
  { icon: TrendingUp, title: 'Mira cómo se mueve', text: 'Sigue su precio en vivo. Vende cuando quieras y el dinero vuelve a tu saldo.' },
]

export default function Landing() {
  const { coins, loading } = useMarket()
  // La moneda que más subió en las últimas 24 h (datos en vivo)
  const top = [...coins].sort((a, b) => b.change24h - a.change24h)[0]
  const sleepy = 1000 / Math.pow(1 + INFLATION, 5)

  const ticker = [
    ...coins.map((c) => ({ k: c.name, v: `${usd(c.price, { price: true })} ${c.change24h >= 0 ? '▲' : '▼'} ${Math.abs(c.change24h).toFixed(2)}%`, up: c.change24h >= 0 })),
    { k: 'Compra desde', v: '$1', up: true },
    { k: 'Comisiones', v: '$0.00', up: true },
    { k: 'Precios en vivo', v: 'cada 5 s', up: true },
    { k: 'Cuenta de ahorro del banco', v: '0.75% al año', up: false },
  ]

  return (
    <div className="relative overflow-x-hidden">
      {/* Fondo animado */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <span className="cp-blob left-[-120px] top-[-80px] h-[420px] w-[420px] bg-[#C94BE0]" />
        <span className="cp-blob b2 right-[-140px] top-[120px] h-[460px] w-[460px] bg-[#6A4BFF]" />
        <span className="cp-blob b3 left-[35%] top-[420px] h-[320px] w-[320px] bg-[#F7931A]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between gap-3 py-5">
          <Logo className="hidden lg:inline-flex" />
          <Link to="/login" className="rounded-xl px-1 py-2 text-base font-semibold text-fg lg:hidden">
            Iniciar sesión
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-fg lg:block">
              Iniciar sesión
            </Link>
            <Link to="/registro">
              <Button size="sm">Crear cuenta</Button>
            </Link>
          </div>
        </header>

        {/* ---------- Héroe ---------- */}
        <section className="grid items-center gap-12 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
          <motion.div initial={{ y: 18 }} animate={{ y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            {/* Logo grande solo en celular: lo primero que se ve */}
            <div className="cp-pop-in flex flex-col items-center gap-3 lg:hidden">
              <LogoIcon size={112} animated glow />
              <span className="font-display text-5xl font-extrabold lowercase tracking-[-0.04em]">
                <span className="cp-wordmark-shine">cutter</span><span className="text-aurora">pay</span>
              </span>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pl-1 pr-3 text-sm backdrop-blur">
              <span className="flex -space-x-2">
                {coins.map((c) => <span key={c.symbol} className="rounded-full ring-2 ring-bg"><CoinIcon symbol={c.symbol} color={c.color} size={26} /></span>)}
              </span>
              <span className="font-semibold">Bitcoin · Ethereum · Dogecoin</span>
            </div>
            <h1 className="text-[2.5rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              Haz crecer tu dinero <span className="text-aurora">así de sencillo</span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted lg:mx-0">
              Saca tus dólares de la cuenta del banco y ponlos en <b className="text-fg">monedas digitales</b>. Compra desde $1, en 3 pasos y sin palabras raras.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link to="/registro" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg sm:w-auto sm:text-base">
                  Crear mi cuenta gratis <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">Ya tengo cuenta</Button>
              </Link>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-base text-muted lg:justify-start lg:text-sm">
              {['$10,000 para practicar', 'Desde $1', 'Sin comisiones'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-ok" /> {t}</li>
              ))}
            </ul>
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
      <div className="relative border-y border-line bg-surface/60 py-3 backdrop-blur" aria-label="Precios en vivo">
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
        {/* ---------- Las 3 monedas ---------- */}
        <section className="flex flex-col gap-8 py-16">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Las monedas digitales de CUTTERPAY</p>
            <h2 className="text-3xl font-bold sm:text-5xl">Tres monedas para empezar a invertir</h2>
            <p className="text-lg text-muted">Te explicamos cada una sin palabras técnicas. Sus precios se mueven en vivo, como en un mercado real.</p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
            {loading
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[420px] rounded-4xl" />)
              : coins.map((c, i) => {
                  const a = ABOUT[c.symbol]
                  return (
                    <motion.article
                      key={c.symbol}
                      initial={{ y: 14 }}
                      animate={{ y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative flex flex-col gap-4 overflow-hidden rounded-4xl border border-line bg-surface p-6 transition hover:-translate-y-1 hover:border-primary/50"
                    >
                      <span className="absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-25 blur-3xl transition group-hover:opacity-40" style={{ background: c.color }} />
                      <div className="relative flex items-center gap-3">
                        <CoinIcon symbol={c.symbol} color={c.color} size={52} />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-2xl font-bold">{c.name}</h3>
                          <p className="text-sm font-semibold text-muted">{c.symbol}</p>
                        </div>
                        {a && <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${a.tone}`}>{a.moves}</span>}
                      </div>
                      <div className="relative flex items-end justify-between gap-3">
                        <div>
                          <p key={c.price} className="tabular animate-flash rounded-lg font-display text-3xl font-bold">{usd(c.price, { price: true })}</p>
                          <Change value={c.change24h} className="text-sm" /> <span className="text-xs text-muted">en 24 h</span>
                        </div>
                        <Sparkline data={c.spark} width={110} height={44} />
                      </div>
                      {a && <p className="relative text-sm text-muted">{a.text}</p>}
                      <p className="relative rounded-2xl bg-bg/60 px-4 py-3 text-sm">
                        Con <b>$10</b> compras <b className="tabular">{qty(Math.floor((10 / c.price) * 1e8) / 1e8)} {c.symbol}</b>
                      </p>
                      <Link to="/registro" className="relative mt-auto">
                        <Button className="w-full">Comprar {c.name}</Button>
                      </Link>
                    </motion.article>
                  )
                })}
          </div>
        </section>

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
            <div className="rounded-3xl bg-bg/60 p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold"><Ban className="h-4 w-4 text-bad" /> $1,000 dormidos en el banco</p>
                <span className="relative font-display text-sm font-bold text-muted">
                  <span className="cp-zzz absolute -right-1 -top-4">z</span>
                  <span className="cp-zzz absolute -right-4 -top-6">z</span>
                  <span className="cp-zzz absolute -right-7 -top-8">Z</span>
                </span>
              </div>
              <p className="tabular mt-2 font-display text-3xl font-bold text-bad">En 5 años compran como {usd(sleepy)}</p>
              <div className="mt-3 h-3 rounded-full bg-surface2">
                <div className="cp-shrink h-full w-full rounded-full bg-bad/60" />
              </div>
            </div>

            <div className="relative rounded-3xl border border-primary/30 bg-primary/10 p-5">
              {top ? (
                <>
                  <p className="flex items-center gap-2 font-semibold">
                    <CoinIcon symbol={top.symbol} color={top.color} size={22} /> {top.change24h >= 0 ? 'La que más subió hoy' : 'Hoy el mercado bajó'}: {top.name}
                  </p>
                  <p className={`tabular mt-2 font-display text-3xl font-bold ${top.change24h >= 0 ? 'text-ok' : 'text-bad'}`}>
                    {top.change24h >= 0 ? '+' : ''}{top.change24h.toFixed(2)}% <span className="text-base font-semibold text-muted">en 24 h</span>
                  </p>
                  <Sparkline data={top.spark} width={420} height={70} className="mt-2 h-16 w-full" />
                </>
              ) : (
                <Skeleton className="mt-3 h-24" />
              )}
              <p className="mt-2 text-sm text-muted">Tus dólares dejan de dormir: se mueven con el mercado y tú decides cuándo vender.</p>
            </div>
            <p className="text-xs text-muted">El precio de las monedas digitales sube y baja. Por eso te damos $10,000 para practicar antes de usar tu dinero. Inflación de ejemplo: 3% al año.</p>
          </div>
        </section>

        {/* ---------- Beneficios ---------- */}
        <section className="flex flex-col gap-8 py-16">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-wider text-ok">La solución</p>
            <h2 className="text-3xl font-bold sm:text-5xl">Despierta tu dinero con CUTTERPAY</h2>
          </div>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group flex items-start gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-aurora text-white transition group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <section className="flex flex-col gap-6 py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Comprar monedas digitales es tan fácil como comprar en línea</h2>
          <ol className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
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

        {/* ---------- Cierre ---------- */}
        <section className="relative my-12 overflow-hidden rounded-4xl bg-surface px-6 py-14 text-center">
          <span className="cp-glow-ring" />
          <span className="cp-blob left-[10%] top-[-60px] h-56 w-56 bg-[#C94BE0]" />
          <span className="cp-blob b2 bottom-[-80px] right-[5%] h-56 w-56 bg-[#F7931A]" />
          <div className="relative flex flex-col items-center gap-5">
            <LogoIcon size={72} animated glow />
            <h2 className="max-w-2xl text-3xl font-bold sm:text-5xl">Tu primera moneda digital está a un minuto</h2>
            <p className="max-w-md text-muted">Crea tu cuenta, recibe $10,000 para practicar y compra Bitcoin, Ethereum o Dogecoin en tres pasos.</p>
            <Link to="/registro">
              <Button size="lg">Crear mi cuenta gratis <ArrowRight className="h-5 w-5" /></Button>
            </Link>
          </div>
        </section>

        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          CUTTERPAY · Proyecto académico de Desarrollo Web, Universidad Mariano Gálvez de Guatemala. Saldos y precios de práctica.
        </footer>
      </div>
    </div>
  )
}
