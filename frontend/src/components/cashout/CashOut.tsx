import { useId, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Lock, Smartphone, Landmark, Banknote, Clock } from 'lucide-react'
import { cashOutSchema, CASHOUT_BANKS } from '@shared/validation.js'
import { api, ApiError, emitWalletChanged } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { usd } from '@/lib/format'
import { playSuccess } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { VerifyCode, type Challenge } from '@/components/security/VerifyCode'
import { DpiStep } from '@/components/security/DpiStep'
import { Confetti } from '@/components/checkout/Confetti'

type Method = 'billetera' | 'banco' | 'cajero'

/* ---------- Ilustraciones SVG animadas con CSS ---------- */
function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="110" y2="110">
        <stop offset="0" stopColor="#FF6FB5" />
        <stop offset=".5" stopColor="#C94BE0" />
        <stop offset="1" stopColor="#8A6BFF" />
      </linearGradient>
    </defs>
  )
}
function ArtWallet() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible" aria-hidden>
      <Grad id={id} />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect className="cp-draw" x="38" y="16" width="44" height="86" rx="10" pathLength={1} />
        <path className="cp-draw" d="M54 92 H66" pathLength={1} style={{ animationDelay: '.3s' }} />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="cp-coin-fly" style={{ animationDelay: `${i * 0.8}s` }}>
          <circle cx={50 + i * 10} cy="62" r="7" fill="#4FD1A5" stroke="#B7F5DF" strokeWidth="2" />
          <text x={50 + i * 10} y="65.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0B0912">$</text>
        </g>
      ))}
    </svg>
  )
}
function ArtBank() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible" aria-hidden>
      <Grad id={id} />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path className="cp-draw" d="M16 46 L60 20 L104 46 Z" pathLength={1} />
        <path className="cp-draw" d="M28 54 V86 M48 54 V86 M72 54 V86 M92 54 V86" pathLength={1} style={{ animationDelay: '.3s' }} />
        <path className="cp-draw" d="M14 96 H106" pathLength={1} style={{ animationDelay: '.6s' }} />
      </g>
      <path className="cp-rise-arrow" d="M60 112 V100 M53 106 L60 99 L67 106" fill="none" stroke="#4FD1A5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ArtAtm() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible" aria-hidden>
      <Grad id={id} />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect className="cp-draw" x="26" y="14" width="68" height="70" rx="8" pathLength={1} />
        <rect className="cp-draw" x="36" y="24" width="48" height="24" rx="4" pathLength={1} style={{ animationDelay: '.3s' }} />
        <path className="cp-draw" d="M40 70 H80" pathLength={1} style={{ animationDelay: '.5s' }} />
      </g>
      <g className="cp-cash-out">
        <rect x="44" y="70" width="32" height="20" rx="3" fill="#4FD1A5" />
        <circle cx="60" cy="80" r="5" fill="none" stroke="#0B0912" strokeWidth="2" />
      </g>
      <circle className="cp-blink" cx="76" cy="36" r="3" fill="#FF6FB5" />
    </svg>
  )
}

const METHODS: { id: Method; title: string; sub: string; icon: typeof Smartphone; Art: () => JSX.Element; time: string }[] = [
  { id: 'billetera', title: 'Billetera digital', sub: 'A tu número de celular', icon: Smartphone, Art: ArtWallet, time: 'Al instante' },
  { id: 'banco', title: 'Cuenta de banco', sub: 'Banco local de Guatemala', icon: Landmark, Art: ArtBank, time: 'En minutos' },
  { id: 'cajero', title: 'Efectivo en cajero', sub: 'Sin tarjeta, con un código', icon: Banknote, Art: ArtAtm, time: 'Hasta 24 h' },
]

const STEPS = ['Destino', 'Datos', 'Revisa', 'Código', 'Listo']

interface Receipt {
  amount: number
  destination: string
  method: Method
  code: string | null
  pin: string | null
  balance: number
}

/** Sacar dinero del saldo en 5 pasos, sin palabras técnicas. */
export function CashOut({ balance }: { balance: number }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<Method | null>(null)
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [bank, setBank] = useState<string>(CASHOUT_BANKS[0])
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState(user?.name ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const body = useMemo(() => {
    const amt = amount.replace(',', '.')
    if (method === 'billetera') return { method, amount: amt, phone }
    if (method === 'banco') return { method, amount: amt, bank, account, holder }
    return { method, amount: amt }
  }, [method, amount, phone, bank, account, holder])

  const m = METHODS.find((x) => x.id === method)
  const reset = () => {
    setStep(0)
    setMethod(null)
    setAmount('')
    setErrors({})
    setServerError(null)
    setChallenge(null)
    setReceipt(null)
  }

  const validateData = () => {
    const parsed = cashOutSchema.safeParse(body)
    const errs: Record<string, string> = {}
    if (!parsed.success) for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
    if (!errs.amount && Number(body.amount) > balance) errs.amount = `Solo tienes ${usd(balance)} disponibles.`
    setErrors(errs)
    if (Object.keys(errs).length === 0) setStep(2)
  }

  const requestCode = async () => {
    setSending(true)
    setServerError(null)
    try {
      const c = await api<Challenge>('/verificacion/operacion', { method: 'POST', body: { action: 'cash-out', payload: body } })
      setChallenge(c)
      setStep(3)
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'No pudimos enviarte el código.')
    } finally {
      setSending(false)
    }
  }

  const execute = async (code: string) => {
    if (!challenge) return
    const r = await api<Receipt>('/billetera/retirar', { method: 'POST', body, headers: { 'x-cp-desafio': challenge.challengeId, 'x-cp-codigo': code } })
    setReceipt(r)
    setStep(4)
    playSuccess()
    emitWalletChanged()
  }

  const chips = method === 'cajero' ? [20, 50, 100, 200] : [20, 50, 100]

  return (
    <div className="flex flex-col gap-5">
      {/* Pasos */}
      <ol className="flex items-center gap-1.5" aria-label="Pasos">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-1.5">
            <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition', i < step ? 'bg-ok text-bg' : i === step ? 'bg-aurora text-white' : 'bg-surface2 text-muted')}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            {i === step && <span className="whitespace-nowrap text-sm font-semibold">{s}</span>}
            {i < STEPS.length - 1 && <span className={cn('h-px flex-1', i < step ? 'bg-ok' : 'bg-line')} />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {/* 1. ¿A dónde? */}
        {step === 0 && (
          <motion.div key="c0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-3">
            <p className="font-display text-2xl font-bold">¿A dónde quieres tu dinero?</p>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
              {METHODS.map(({ id, title, sub, Art, time }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMethod(id)
                    setStep(1)
                  }}
                  className="group flex items-center gap-4 rounded-3xl border border-line bg-bg/50 p-4 text-left transition hover:-translate-y-1 hover:border-primary/60 sm:flex-col sm:items-start sm:text-left"
                >
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-surface2 p-2 transition group-hover:scale-105"><Art /></span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-bold">{title}</span>
                    <span className="block text-sm text-muted">{sub}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-ok"><Clock className="h-3 w-3" /> {time}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 2. Datos + monto */}
        {step === 1 && m && (
          user && !user.hasDpi ? (
            <motion.div key="cdpi" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
              <DpiStep onDone={() => undefined} />
            </motion.div>
          ) : (
            <motion.div key="c1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-3xl bg-bg/60 p-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface2 p-1.5"><m.Art /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold">{m.title}</p>
                  <p className="text-sm text-muted">{m.sub}</p>
                </div>
                <button type="button" onClick={() => setStep(0)} className="text-sm font-semibold text-primary hover:underline">Cambiar</button>
              </div>

              {method === 'billetera' && (
                <Input label="Número de celular" id="co-phone" inputMode="numeric" placeholder="5555 1234" maxLength={9} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} error={errors.phone} />
              )}
              {method === 'banco' && (
                <>
                  <label htmlFor="co-bank" className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold">Tu banco</span>
                    <select id="co-bank" value={bank} onChange={(e) => setBank(e.target.value)} className="h-12 rounded-2xl border border-line bg-bg/60 px-4 text-[15px] focus:border-primary focus:outline-none">
                      {CASHOUT_BANKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <Input label="Número de cuenta" id="co-account" inputMode="numeric" placeholder="000-000000-0" value={account} onChange={(e) => setAccount(e.target.value.replace(/[^\d -]/g, ''))} error={errors.account} />
                  <Input label="Nombre del titular" id="co-holder" value={holder} onChange={(e) => setHolder(e.target.value)} error={errors.holder} />
                </>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="co-amount" className="text-sm font-semibold">¿Cuánto quieres retirar?</label>
                <div className={cn('flex items-center rounded-3xl border bg-bg/60 px-5 py-3 focus-within:border-primary', errors.amount ? 'border-bad/70' : 'border-line')}>
                  <span className="font-display text-3xl font-bold text-muted">$</span>
                  <input id="co-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0" className="tabular w-full bg-transparent pl-2 font-display text-3xl font-bold outline-none placeholder:text-muted/40" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {chips.filter((v) => v <= balance).map((v) => (
                    <button key={v} type="button" onClick={() => setAmount(String(v))} className="rounded-2xl border border-line px-4 py-2 text-sm font-bold text-muted hover:border-primary/60 hover:text-fg">${v}</button>
                  ))}
                  {method !== 'cajero' && balance >= 10 && (
                    <button type="button" onClick={() => setAmount((Math.floor(balance * 100) / 100).toFixed(2))} className="rounded-2xl border border-line px-4 py-2 text-sm font-bold text-muted hover:border-primary/60 hover:text-fg">Todo</button>
                  )}
                </div>
                {errors.amount ? <p role="alert" className="text-sm font-semibold text-bad">{errors.amount}</p> : <p className="text-sm text-muted">Disponible: <b>{usd(balance)}</b>{method === 'cajero' && ' · en cajero, montos enteros hasta $400'}</p>}
              </div>
              <Button size="lg" onClick={validateData}>Continuar</Button>
            </motion.div>
          )
        )}

        {/* 3. Revisa */}
        {step === 2 && m && (
          <motion.div key="c2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-4">
            <div className="rounded-3xl border border-line bg-bg/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Resumen</p>
              <dl className="mt-3 flex flex-col gap-3 text-sm">
                <Row k="Sale de" v="Tu saldo disponible" />
                <Row k="Llega a" v={method === 'billetera' ? `Celular ····${phone.replace(/\D/g, '').slice(-4)}` : method === 'banco' ? `${bank} ····${account.replace(/\D/g, '').slice(-4)}` : 'Código para cajero'} />
                <Row k="Tiempo" v={m.time} />
                <Row k="Comisión" v={<span className="text-ok">$0.00</span>} />
                <div className="my-1 h-px bg-line" />
                <div className="flex items-baseline justify-between">
                  <dt className="font-semibold">Recibes</dt>
                  <dd className="tabular font-display text-3xl font-bold">{usd(Number(body.amount))}</dd>
                </div>
              </dl>
            </div>
            {serverError && <p role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 p-3 text-sm font-semibold text-bad">{serverError}</p>}
            <Button size="lg" onClick={requestCode} loading={sending}>{sending ? 'Enviando código…' : <><Lock className="h-4 w-4" /> Continuar con código</>}</Button>
            <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" /> Cambiar datos</button>
          </motion.div>
        )}

        {/* 4. Código */}
        {step === 3 && challenge && (
          <motion.div key="c3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
            <VerifyCode challenge={challenge} onChallenge={setChallenge} resendPath="/verificacion/reenviar" title="Confirma que eres tú" hint={`Para retirar ${usd(Number(body.amount))} te enviamos un código a`} submitLabel="Confirmar retiro" onSubmit={execute} />
          </motion.div>
        )}

        {/* 5. Listo / comprobante */}
        {step === 4 && receipt && (
          <motion.div key="c4" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative flex flex-col items-center gap-4 text-center">
            <Confetti />
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="grid h-20 w-20 place-items-center rounded-full bg-ok text-bg shadow-[0_0_40px_rgba(79,209,165,0.5)]">
              <Check className="h-10 w-10" strokeWidth={3} />
            </motion.span>
            <p className="font-display text-2xl font-bold">{receipt.method === 'cajero' ? '¡Tu código de retiro está listo!' : '¡Retiro enviado!'}</p>
            <p className="tabular font-display text-4xl font-extrabold text-aurora">{usd(receipt.amount)}</p>

            {receipt.method === 'cajero' && receipt.code ? (
              <div className="w-full rounded-3xl border border-primary/40 bg-primary/10 p-5 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">Código</p>
                    <p className="tabular font-display text-2xl font-extrabold tracking-widest">{receipt.code.slice(0, 4)} {receipt.code.slice(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">PIN</p>
                    <p className="tabular font-display text-2xl font-extrabold tracking-widest">{receipt.pin}</p>
                  </div>
                </div>
                <ol className="mt-4 flex flex-col gap-2 text-sm text-muted">
                  <li><b>1.</b> Ve a un cajero que acepte <b>retiro sin tarjeta</b>.</li>
                  <li><b>2.</b> Escribe el código y el PIN.</li>
                  <li><b>3.</b> Retira tu efectivo. <b>Vence en 24 horas.</b></li>
                </ol>
              </div>
            ) : (
              <p className="max-w-xs text-sm text-muted">Enviado a <b>{receipt.destination}</b>. Llega {receipt.method === 'banco' ? 'en unos minutos' : 'al instante'}.</p>
            )}
            <p className="text-sm text-muted">Saldo disponible: <b>{usd(receipt.balance)}</b></p>
            <Button className="w-full" onClick={reset}>Listo</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
