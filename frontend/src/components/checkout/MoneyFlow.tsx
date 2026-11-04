import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Lock, X } from 'lucide-react'
import { fundDepositSchema, LIMITS } from '@shared/validation.js'
import { api, ApiError, emitWalletChanged } from '@/lib/api'
import { playSuccess } from '@/lib/sound'
import { usd, qty as fmtQty } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { CoinIcon } from '@/components/ui/Misc'
import { cn } from '@/lib/utils'
import { Confetti } from './Confetti'
import { VerifyCode, type Challenge } from '@/components/security/VerifyCode'
import { DpiStep } from '@/components/security/DpiStep'
import { useAuth } from '@/context/AuthContext'
import { COIN_INFO } from '@/lib/coins'
import { CardPay, type CardData } from './CardPay'
import { cardSchema } from '@shared/validation.js'
import { LogoIcon } from '@/components/brand/Logo'
import { Badge } from '@/components/ui/Feedback'

export type FlowMode = 'fund-invest' | 'fund-withdraw' | 'crypto-buy' | 'crypto-sell'

export interface FlowTarget {
  /** slug del fondo o símbolo de la moneda */
  key: string
  name: string
  color: string
  /** tasa anual del fondo (%) */
  rate?: number
  /** precio de la moneda */
  price?: number
}

interface Props {
  open: boolean
  onClose: () => void
  mode: FlowMode
  target: FlowTarget | null
  /** Cuánto puede usar: saldo disponible (invertir/comprar) o valor de su posición (retirar/vender) */
  available: number
  /** Tasa de la cuenta de ahorro del banco, para comparar */
  bankRate?: number
  /** Si se pasa (y no hay target), primero pregunta qué moneda comprar */
  pickFrom?: FlowTarget[]
  /** Monto con el que arranca el paso "¿Cuánto?" */
  initialAmount?: number
  /** Primera compra de la persona (mensaje especial al final) */
  firstTime?: boolean
  /** Se llama cuando la operación termina bien */
  onDone?: () => void
}

const STEPS = ['Monto', 'Revisa', 'Código', 'Listo']

const COPY: Record<FlowMode, { title: (n: string) => string; cta: string; confirm: string; done: string; source: string; dest: (n: string) => string }> = {
  'fund-invest': { title: (n) => `Invertir en ${n}`, cta: 'Continuar', confirm: 'Confirmar e invertir', done: '¡Tu dinero ya está creciendo!', source: 'Saldo disponible', dest: (n) => n },
  'fund-withdraw': { title: (n) => `Retirar de ${n}`, cta: 'Continuar', confirm: 'Confirmar retiro', done: '¡Retiro listo!', source: 'Tu fondo', dest: () => 'Saldo disponible' },
  'crypto-buy': { title: (n) => `Comprar ${n}`, cta: 'Continuar', confirm: 'Confirmar compra', done: '¡Compra lista!', source: 'Saldo disponible', dest: (n) => `Tu ${n}` },
  'crypto-sell': { title: (n) => `Vender ${n}`, cta: 'Continuar', confirm: 'Confirmar venta', done: '¡Venta lista!', source: 'Tu posición', dest: () => 'Saldo disponible' },
}

const isOut = (m: FlowMode) => m === 'fund-withdraw' || m === 'crypto-sell'

export function MoneyFlow({ open, onClose, mode, target: targetProp, available, bankRate = 0.75, pickFrom, initialAmount, firstTime, onDone }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [raw, setRaw] = useState('')
  const [all, setAll] = useState(false)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [result, setResult] = useState<{ amount: number; detail: ReactNode } | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [chosen, setChosen] = useState<FlowTarget | null>(targetProp)
  const [payWith, setPayWith] = useState<'saldo' | 'tarjeta'>('saldo')
  const [card, setCard] = useState<CardData>({ holder: '', cardNumber: '', expiry: '', cvc: '' })
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})
  const isDemo = !!user?.email.toLowerCase().endsWith('@cutterpay.com')
  const target = chosen

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    if (open) {
      setStep(0)
      setChosen(targetProp)
      setRaw(initialAmount != null ? String(initialAmount) : isOut(mode) ? '' : '100')
      setAll(false)
      setTouched(false)
      setServerError(null)
      setResult(null)
      setChallenge(null)
    }
  }, [open, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const c = COPY[mode]
  const amount = all ? Math.floor(available * 100) / 100 : Number(raw.replace(',', '.'))

  const error = useMemo(() => {
    if (all) return available < 0.01 ? 'No tienes dinero aquí para retirar.' : null
    if (!raw.trim()) return 'Escribe cuánto.'
    const parsed = fundDepositSchema.safeParse({ amount: raw.replace(',', '.') })
    if (!parsed.success) return isOut(mode) && parsed.error.issues[0].message.startsWith('Puedes') ? 'El mínimo es $1.' : parsed.error.issues[0].message
    if (amount > available + 0.001 && mode !== 'crypto-buy') return isOut(mode) ? `Solo tienes ${usd(available)} aquí.` : `Te faltan ${usd(amount - available)}. Tienes ${usd(available)} disponibles.`
    if (mode === 'crypto-buy' && target?.price && Math.floor((amount / target.price) * 1e8) / 1e8 * target.price < LIMITS.minTradeUsd) return `El mínimo es ${usd(LIMITS.minTradeUsd)}.`
    return null
  }, [raw, all, amount, available, mode, target])

  if (!target && !pickFrom) return <dialog ref={ref} className="hidden" />

  const labels = pickFrom ? ['Moneda', ...STEPS] : STEPS
  const current = target ? step + (pickFrom ? 1 : 0) : 0
  const Stepper = (
    <ol className="flex items-center gap-1.5" aria-label="Pasos">
      {labels.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-1.5">
          <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition', i < current ? 'bg-ok text-bg' : i === current ? 'bg-aurora text-white' : 'bg-surface2 text-muted')}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          {i === current && <span className="whitespace-nowrap text-sm font-semibold text-fg">{s}</span>}
          {i < labels.length - 1 && <span className={cn('h-px flex-1', i < current ? 'bg-ok' : 'bg-line')} />}
        </li>
      ))}
    </ol>
  )
  const dialogClass = 'm-0 mt-auto w-full max-w-none overflow-visible rounded-t-4xl border border-line bg-surface p-0 text-fg shadow-card backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:m-auto sm:w-[min(94vw,480px)] sm:rounded-4xl'

  if (!target) {
    return (
      <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onClose() }} onClick={(e) => { if (e.target === ref.current) onClose() }} className={dialogClass}>
        <div className="relative flex max-h-[92vh] flex-col gap-5 overflow-y-auto p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LogoIcon size={38} animated />
              <h2 className="text-xl font-semibold">Comprar monedas digitales</h2>
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-muted hover:bg-surface2 hover:text-fg" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </div>
          {Stepper}
          <div className="flex flex-col gap-3">
            <p className="font-display text-2xl font-bold">¿Qué moneda quieres comprar?</p>
            <p className="-mt-1 text-sm text-muted">Toca una. Puedes empezar <b>desde $1</b> y comprar otras después.</p>
            {pickFrom!.map((c, i) => {
              const info = COIN_INFO[c.key]
              return (
                <motion.button
                  key={c.key}
                  type="button"
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setChosen(c)}
                  className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-bg/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-surface2"
                >
                  <CoinIcon symbol={c.key} color={c.color} size={46} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-bold">{c.name}</span>
                      {info?.recommended && <Badge tone="primary">Recomendada para empezar</Badge>}
                    </span>
                    {info && <span className="block text-sm text-muted">{info.short}</span>}
                    {c.price != null && (
                      <span className="mt-1 block text-xs text-muted">
                        {c.price >= 1 ? <>Una moneda entera vale {usd(c.price)} · <b>tú compras solo un pedacito</b></> : <>Cada moneda vale {usd(c.price, { price: true })} · <b>con $1 tienes varias</b></>}
                      </span>
                    )}
                    {info && <span className={cn('mt-1 inline-block text-xs font-bold', info.tone === 'ok' ? 'text-ok' : info.tone === 'warn' ? 'text-warn' : 'text-bad')}>{info.moves}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold text-muted">Empieza</span>
                    <span className="block font-display text-xl font-bold text-ok">desde $1</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </dialog>
    )
  }

  const yearly = target.rate ? amount * (target.rate / 100) : 0
  const bankYearly = amount * (bankRate / 100)
  const coinQty = target.price ? Math.floor((amount / target.price) * 1e8) / 1e8 : 0

  const chips = isOut(mode)
    ? [
        { label: '25%', v: Math.floor(available * 25) / 100 },
        { label: '50%', v: Math.floor(available * 50) / 100 },
        { label: 'Todo', v: -1 },
      ]
    : [25, 50, 100, 500].filter((v) => v <= Math.max(available, 25)).map((v) => ({ label: `$${v}`, v }))

  const next = () => {
    setTouched(true)
    if (!error) {
      // Si no le alcanza el saldo, la compra se paga con tarjeta
      if (mode === 'crypto-buy') setPayWith(amount > available + 0.001 ? 'tarjeta' : payWith)
      setStep(1)
    }
  }

  // Paso 2 → 3: pedir el código al correo para autorizar exactamente esta operación
  const body = (): Record<string, unknown> =>
    mode.startsWith('fund')
      ? all ? { all: true } : { amount }
      : all ? { symbol: target.key, all: true } : { symbol: target.key, amountUsd: amount, ...(mode === 'crypto-buy' && payWith === 'tarjeta' ? { card } : {}) }

  const confirm = async () => {
    if (mode === 'crypto-buy' && payWith === 'tarjeta') {
      const parsed = cardSchema.safeParse(card)
      if (!parsed.success) {
        const errs: Record<string, string> = {}
        for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
        setCardErrors(errs)
        return
      }
      setCardErrors({})
    }
    setSending(true)
    setServerError(null)
    try {
      const c = await api<Challenge>('/verificacion/operacion', {
        method: 'POST',
        body: { action: mode, slug: mode.startsWith('fund') ? target.key : undefined, payload: body() },
      })
      setChallenge(c)
      setStep(2)
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'No pudimos enviarte el código. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  // Paso 3 → 4: con el código correcto se hace la operación
  const execute = async (code: string) => {
    if (!challenge) return
    const headers = { 'x-cp-desafio': challenge.challengeId, 'x-cp-codigo': code }
    {
      let detail: ReactNode = null
      let final = amount
      if (mode === 'fund-invest') {
        const r = await api<{ amount: number; yearlyGain: number }>(`/fondos/${target.key}/invertir`, { method: 'POST', body: body(), headers })
        final = r.amount
        detail = <>En un año ganarías unos <b className="text-ok">{usd(r.yearlyGain)}</b> sin hacer nada más.</>
      } else if (mode === 'fund-withdraw') {
        const r = await api<{ amount: number; gain: number }>(`/fondos/${target.key}/retirar`, { method: 'POST', body: body(), headers })
        final = r.amount
        detail = <>Ya está en tu saldo disponible. De eso, <b className="text-ok">{usd(r.gain)}</b> fueron ganancias.</>
      } else {
        const r = await api<{ transaction: { quantity: number; total: number; price: number; gain: number | null } }>(
          `/transacciones/${mode === 'crypto-buy' ? 'compra' : 'venta'}`,
          { method: 'POST', body: body(), headers },
        )
        final = r.transaction.total
        detail =
          mode === 'crypto-buy' ? (
            <>Recibiste <b>{fmtQty(r.transaction.quantity)} {target.key}</b> a {usd(r.transaction.price, { price: true })} cada uno.</>
          ) : (
            <>Vendiste {fmtQty(r.transaction.quantity)} {target.key}. {r.transaction.gain != null && <>Resultado: <b className={r.transaction.gain >= 0 ? 'text-ok' : 'text-bad'}>{usd(r.transaction.gain)}</b>.</>}</>
          )
      }
      if (firstTime && mode === 'crypto-buy') {
        detail = <>{detail} <b>Vuelve mañana</b> para ver cómo se movió tu inversión.</>
      }
      setResult({ amount: final, detail })
      setStep(3)
      onDone?.()
      playSuccess()
      emitWalletChanged()
    }
  }

  const shownError = touched ? error : null

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        if (!sending) onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current && !sending) onClose()
      }}
      className={dialogClass}
    >
      <div className="relative flex max-h-[92vh] flex-col gap-5 overflow-y-auto p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {mode.startsWith('crypto') ? (
              <CoinIcon symbol={target.key} color={target.color} size={38} />
            ) : (
              <span className="grid h-[38px] w-[38px] place-items-center rounded-2xl font-display text-sm font-bold text-bg" style={{ background: target.color }}>
                {target.rate?.toFixed(1)}%
              </span>
            )}
            <h2 className="text-xl font-semibold">{c.title(target.name)}</h2>
          </div>
          <button onClick={onClose} disabled={sending} className="rounded-xl p-1.5 text-muted hover:bg-surface2 hover:text-fg" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pasos (número, y ✓ al completar) */}
        {Stepper}

        {mode === 'fund-withdraw' && !user?.hasDpi ? (
          <DpiStep onDone={() => setStep(0)} />
        ) : (
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="flow-amount" className="text-sm font-semibold text-muted">
                  {isOut(mode) ? '¿Cuánto quieres pasar a tu saldo?' : '¿Cuánto quieres invertir?'}
                </label>
                {pickFrom && (
                  <button type="button" onClick={() => setChosen(null)} className="text-sm font-semibold text-primary hover:underline">
                    Cambiar moneda
                  </button>
                )}
              </div>
              <div className={cn('flex items-center rounded-3xl border bg-bg/60 px-5 py-3 transition focus-within:border-primary', shownError ? 'border-bad/70' : 'border-line')}>
                <span className="font-display text-4xl font-bold text-muted">$</span>
                <input
                  id="flow-amount"
                  autoFocus
                  inputMode="decimal"
                  autoComplete="off"
                  value={all ? amount.toFixed(2) : raw}
                  onChange={(e) => {
                    setAll(false)
                    setRaw(e.target.value.replace(/[^\d.,]/g, ''))
                    setTouched(true)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  className="tabular w-full bg-transparent pl-2 font-display text-4xl font-bold text-fg outline-none placeholder:text-muted/40"
                  placeholder="0"
                  aria-invalid={!!shownError}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {chips.map((ch) => (
                  <button
                    key={ch.label}
                    type="button"
                    onClick={() => {
                      setTouched(true)
                      if (ch.v === -1) setAll(true)
                      else {
                        setAll(false)
                        setRaw(String(ch.v))
                      }
                    }}
                    className="rounded-2xl border border-line px-4 py-2 text-sm font-bold text-muted transition hover:border-primary/60 hover:text-fg"
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted">
                {isOut(mode) ? 'Tienes aquí' : 'Disponible'}: <b className="tabular text-fg">{usd(available)}</b>
              </p>
              {shownError && (
                <p role="alert" className="text-sm font-semibold text-bad">
                  {shownError}
                </p>
              )}

              {/* Vista previa en lenguaje simple */}
              {!error && amount > 0 && (
                <div className="rounded-3xl bg-bg/60 p-4 text-sm">
                  {mode === 'fund-invest' && (
                    <div className="flex flex-col gap-2">
                      <p>
                        En 1 año tendrías <b className="tabular text-ok">{usd(amount + yearly)}</b>
                      </p>
                      <div className="flex items-center justify-between text-muted">
                        <span>Ganas con CUTTERPAY</span>
                        <span className="tabular font-semibold text-ok">+{usd(yearly)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted">
                        <span>En una cuenta de ahorro del banco</span>
                        <span className="tabular">+{usd(bankYearly)}</span>
                      </div>
                    </div>
                  )}
                  {mode === 'crypto-buy' && (
                    <p>
                      Recibes aproximadamente <b className="tabular">{fmtQty(coinQty)} {target.key}</b> al precio de hoy ({usd(target.price || 0, { price: true })}).
                    </p>
                  )}
                  {isOut(mode) && <p>El dinero pasa a tu saldo disponible al instante.</p>}
                </div>
              )}
              <Button size="lg" onClick={next}>
                {c.cta}
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="rounded-3xl border border-line bg-bg/50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Resumen</p>
                <dl className="mt-3 flex flex-col gap-3 text-sm">
                  <Row k="Sale de" v={mode === 'crypto-buy' && payWith === 'tarjeta' ? 'Tu tarjeta' : c.source} />
                  <Row k="Llega a" v={c.dest(target.name)} />
                  {mode === 'fund-invest' && <Row k="Rendimiento anual" v={`${target.rate}%`} />}
                  {mode === 'fund-invest' && <Row k="Ganancia estimada en 1 año" v={<span className="text-ok">+{usd(yearly)}</span>} />}
                  {mode === 'crypto-buy' && <Row k="Recibes aprox." v={`${fmtQty(coinQty)} ${target.key}`} />}
                  <Row k="Comisión" v={<span className="text-ok">$0.00</span>} />
                  <div className="my-1 h-px bg-line" />
                  <div className="flex items-baseline justify-between">
                    <dt className="font-semibold">Total</dt>
                    <dd className="tabular font-display text-3xl font-bold">{usd(amount)}</dd>
                  </div>
                </dl>
              </div>
              {mode === 'crypto-buy' && (
                <CardPay payWith={payWith} setPayWith={setPayWith} balance={available} amount={amount} card={card} setCard={setCard} errors={cardErrors} demo={isDemo} holderName={user?.name ?? ''} />
              )}
              {serverError && (
                <p role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 p-3 text-sm font-semibold text-bad">
                  {serverError}
                </p>
              )}
              <p className="text-center text-xs text-muted">Te enviaremos un <b>código a tu correo</b> para confirmar que eres tú. Así evitamos fraudes y robos.</p>
              <Button size="lg" onClick={confirm} loading={sending}>
                {sending ? 'Procesando…' : (
                  <>
                    <Lock className="h-4 w-4" /> Continuar con código
                  </>
                )}
              </Button>
              <button onClick={() => setStep(0)} disabled={sending} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
                <ArrowLeft className="h-4 w-4" /> Cambiar el monto
              </button>
              {mode.startsWith('crypto') && <p className="text-center text-xs text-muted">El precio final se fija al confirmar.</p>}
            </motion.div>
          )}

          {step === 2 && challenge && (
            <motion.div key="s2c" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
              <VerifyCode
                challenge={challenge}
                onChallenge={setChallenge}
                resendPath="/verificacion/reenviar"
                title="Confirma que eres tú"
                hint={`Por tu seguridad, para mover ${usd(amount)} te enviamos un código a`}
                submitLabel={c.confirm}
                onSubmit={execute}
              />
              <button onClick={() => setStep(0)} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
                <ArrowLeft className="h-4 w-4" /> Cambiar el monto
              </button>
            </motion.div>
          )}

          {step === 3 && result && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative flex flex-col items-center gap-4 py-2 text-center">
              <Confetti />
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                className="grid h-20 w-20 place-items-center rounded-full bg-ok text-bg shadow-[0_0_40px_rgba(79,209,165,0.5)]"
              >
                <Check className="h-10 w-10" strokeWidth={3} />
              </motion.span>
              <div>
                <p className="font-display text-2xl font-bold">{firstTime && mode === 'crypto-buy' ? '¡Compraste tu primera moneda digital!' : c.done}</p>
                <p className="tabular mt-1 font-display text-4xl font-extrabold text-aurora">{usd(result.amount)}</p>
              </div>
              <p className="max-w-xs text-sm text-muted">{result.detail}</p>
              <div className="mt-2 grid w-full grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose()
                    navigate(mode.startsWith('fund') ? '/app/fondos' : '/app/portafolio')
                  }}
                >
                  Ver mi dinero
                </Button>
                <Button onClick={onClose}>Listo</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </dialog>
  )
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular text-right font-semibold">{v}</dd>
    </div>
  )
}
