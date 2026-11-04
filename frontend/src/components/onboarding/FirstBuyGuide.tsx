import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useMarket, useWallet } from '@/hooks/useMarket'
import { api } from '@/lib/api'
import { usd, qty, firstName } from '@/lib/format'
import { COIN_INFO } from '@/lib/coins'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Feedback'
import { CoinIcon } from '@/components/ui/Misc'
import { FloatingArt } from '@/components/motion/FloatingArt'
import { MoneyFlow, type FlowTarget } from '@/components/checkout/MoneyFlow'

const AMOUNTS = [10, 25, 50]
const STEP_COUNT = 4

/**
 * Guía de bienvenida (solo la primera vez): acompaña a la persona hasta comprar su primera moneda.
 * 1) Bienvenida  2) Qué es una moneda digital  3) Elige tu moneda  4) Cuánto  → compra real (MoneyFlow)
 */
export function FirstBuyGuide() {
  const { user, markOnboarded } = useAuth()
  const { coins } = useMarket()
  const wallet = useWallet()
  const ref = useRef<HTMLDialogElement>(null)
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [coin, setCoin] = useState<string>('BTC')
  const [amount, setAmount] = useState(10)
  const [buying, setBuying] = useState<FlowTarget | null>(null)

  // Aparece después de la animación de bienvenida
  useEffect(() => {
    if (!user || user.role === 'admin' || user.onboarded) return
    const id = setTimeout(() => setVisible(true), 2600)
    return () => clearTimeout(id)
  }, [user])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (visible && !d.open) d.showModal()
    if (!visible && d.open) d.close()
  }, [visible])

  const finish = () => {
    markOnboarded()
    api('/perfil/onboarding', { method: 'POST' }).catch(() => {})
  }
  const skip = () => {
    finish()
    setVisible(false)
  }
  const startBuy = () => {
    const c = coins.find((x) => x.symbol === coin)
    if (!c) return
    finish()
    setVisible(false)
    setBuying({ key: c.symbol, name: c.name, color: c.color, price: c.price })
  }

  if (!user || user.role === 'admin') return null
  const selected = coins.find((c) => c.symbol === coin)

  return (
    <>
      <dialog
        ref={ref}
        onCancel={(e) => { e.preventDefault(); skip() }}
        className="m-0 mt-auto w-full max-w-none overflow-visible rounded-t-4xl border border-primary/30 bg-surface p-0 text-fg shadow-card backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:m-auto sm:w-[min(94vw,500px)] sm:rounded-4xl"
      >
        <div className="relative flex max-h-[92vh] flex-col gap-5 overflow-y-auto p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5" aria-label={`Paso ${step + 1} de ${STEP_COUNT}`}>
              {Array.from({ length: STEP_COUNT }).map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-8 bg-aurora' : i < step ? 'w-4 bg-primary' : 'w-4 bg-surface2')} />
              ))}
            </div>
            <button onClick={skip} className="flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-semibold text-muted hover:text-fg">
              Lo haré después <X className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="g0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col items-center gap-4 text-center">
                <FloatingArt name="gift" size={170} className="-my-4" />
                <h2 className="text-3xl font-bold">¡Te damos la bienvenida, {firstName(user.name)}!</h2>
                <p className="text-muted">
                  Tienes <span className="cp-mark">{usd(wallet.data?.balance ?? 1000)} de prueba</span>. Vamos a hacer <b>tu primera compra juntos</b>. Toma menos de un minuto.
                </p>
                <Button size="lg" className="w-full" onClick={() => setStep(1)}>Empezar <ArrowRight className="h-5 w-5" /></Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="g1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col items-center gap-4 text-center">
                <FloatingArt name="grow" size={160} className="-my-4" />
                <h2 className="text-3xl font-bold">¿Qué es una moneda digital?</h2>
                <ul className="flex w-full flex-col gap-2 text-left">
                  {[
                    <>Es <b>dinero que vive en internet</b>, como Bitcoin.</>,
                    <>Su precio <b>sube y baja</b> durante el día.</>,
                    <>Si compras y luego su precio sube, <span className="cp-mark ok">ganas la diferencia</span>.</>,
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl bg-bg/60 p-3 text-muted">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-aurora font-display text-sm font-bold text-white">{i + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full" onClick={() => setStep(2)}>Entendido <ArrowRight className="h-5 w-5" /></Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="g2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-3">
                <h2 className="text-3xl font-bold">Elige tu primera moneda</h2>
                <p className="-mt-1 text-muted">Si no sabes cuál, <b>Bitcoin es la más conocida</b> y la ideal para empezar.</p>
                {coins.map((c) => {
                  const info = COIN_INFO[c.symbol]
                  const active = coin === c.symbol
                  return (
                    <button
                      key={c.symbol}
                      type="button"
                      onClick={() => setCoin(c.symbol)}
                      aria-pressed={active}
                      className={cn('flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition', active ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-line bg-bg/50 hover:border-primary/40')}
                    >
                      <CoinIcon symbol={c.symbol} color={c.color} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-lg font-bold">{c.name}</span>
                          {info?.recommended && <Badge tone="primary">Recomendada</Badge>}
                        </span>
                        {info && <span className="block text-sm text-muted">{info.short}</span>}
                      </span>
                      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', active ? 'border-primary bg-primary' : 'border-line')}>
                        {active && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                    </button>
                  )
                })}
                <Button size="lg" className="mt-1 w-full" onClick={() => setStep(3)} disabled={!coins.length}>
                  Continuar con {selected?.name ?? 'Bitcoin'} <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="g3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-4">
                <h2 className="text-3xl font-bold">¿Con cuánto empiezas?</h2>
                <p className="-mt-2 text-muted">Te recomendamos <b>empezar con poco</b>. Siempre puedes comprar más después.</p>
                <div className="grid grid-cols-3 gap-2">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      aria-pressed={amount === a}
                      className={cn('rounded-3xl border py-5 font-display text-2xl font-bold transition', amount === a ? 'border-primary bg-primary/15 text-fg ring-1 ring-primary/40' : 'border-line text-muted hover:text-fg')}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                {selected && (
                  <div className="flex items-center gap-3 rounded-3xl bg-bg/60 p-4">
                    <CoinIcon symbol={selected.symbol} color={selected.color} size={36} />
                    <p className="text-muted">
                      Con <b>${amount}</b> recibes <b className="tabular">{qty(Math.floor((amount / selected.price) * 1e8) / 1e8)} {selected.symbol}</b>. Sin comisiones.
                    </p>
                  </div>
                )}
                <Button size="lg" className="w-full" onClick={startBuy} disabled={!selected}>
                  Comprar mis ${amount} de {selected?.name ?? 'Bitcoin'} <ArrowRight className="h-5 w-5" />
                </Button>
                <button type="button" onClick={() => setStep(2)} className="text-sm font-semibold text-muted hover:text-fg">Cambiar moneda</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </dialog>

      {buying && (
        <MoneyFlow
          open
          mode="crypto-buy"
          target={buying}
          available={wallet.data?.balance ?? 0}
          initialAmount={amount}
          firstTime
          onClose={() => setBuying(null)}
        />
      )}
    </>
  )
}
