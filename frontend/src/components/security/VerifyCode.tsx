import { useEffect, useState } from 'react'
import { MailCheck, ShieldCheck, RotateCw } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { CodeInput } from './CodeInput'
import { FloatingArt } from '@/components/motion/FloatingArt'

export interface Challenge {
  needsCode: true
  challengeId: string
  email: string
  expiresInMin: number
  /** Solo cuentas de demostración (sin buzón real) o local sin correo configurado */
  demoCode?: string
}

interface Props {
  challenge: Challenge
  /** Recibe el código y debe lanzar ApiError si es incorrecto */
  onSubmit: (code: string) => Promise<void>
  onChallenge: (c: Challenge) => void
  resendPath: string
  submitLabel?: string
  title?: string
  hint?: string
}

const COOLDOWN = 30

/** Paso "Revisa tu correo": pide el código de 6 dígitos, permite pegarlo y reenviarlo. */
export function VerifyCode({ challenge, onSubmit, onChallenge, resendPath, submitLabel = 'Confirmar', title = 'Revisa tu correo', hint }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [wait, setWait] = useState(COOLDOWN)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    setCode('')
    setError(null)
    setWait(COOLDOWN)
  }, [challenge.challengeId])

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const submit = async (value = code) => {
    if (value.length !== 6 || sending) {
      if (value.length !== 6) setError('Escribe los 6 dígitos del código.')
      return
    }
    setSending(true)
    setError(null)
    try {
      await onSubmit(value)
    } catch (e) {
      setError(e instanceof ApiError ? e.fieldErrors?.code || e.message : 'No pudimos verificar el código. Intenta de nuevo.')
      setCode('')
    } finally {
      setSending(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setError(null)
    try {
      const c = await api<Challenge>(resendPath, { method: 'POST', body: { challengeId: challenge.challengeId } })
      onChallenge(c)
      setResent(true)
      setWait(COOLDOWN)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos reenviar el código.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <FloatingArt name="shield" size={150} className="-my-4" />
        <p className="flex items-center gap-2 font-display text-2xl font-bold"><MailCheck className="h-5 w-5 text-primary" /> {title}</p>
        <p className="max-w-sm text-sm text-muted">
          {hint ?? 'Te enviamos un código de 6 dígitos a'} <b className="text-fg">{challenge.email}</b>. Cópialo y pégalo aquí.
        </p>
      </div>

      {challenge.demoCode && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-warn/30 bg-warn/10 p-3 text-sm">
          <span>
            Cuenta de demostración: tu código es <b className="tabular font-display text-base tracking-widest">{challenge.demoCode}</b>
          </span>
          <button type="button" onClick={() => { setCode(challenge.demoCode!); submit(challenge.demoCode!) }} className="rounded-xl border border-warn/40 px-3 py-1 text-xs font-bold text-warn hover:bg-warn/10">
            Usar código
          </button>
        </div>
      )}

      <CodeInput value={code} onChange={(v) => { setCode(v); setError(null) }} onComplete={(v) => submit(v)} invalid={!!error} disabled={sending} />

      {error && <p role="alert" className="text-sm font-semibold text-bad">{error}</p>}
      {resent && !error && <p className="text-sm text-ok">Te enviamos un código nuevo.</p>}

      <Button size="lg" onClick={() => submit()} loading={sending}>
        {sending ? 'Verificando…' : (<><ShieldCheck className="h-5 w-5" /> {submitLabel}</>)}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>Vence en {challenge.expiresInMin} minutos. Revisa también la carpeta de spam.</span>
        <button type="button" onClick={resend} disabled={wait > 0 || resending} className="flex items-center gap-1.5 font-semibold text-primary disabled:text-muted">
          <RotateCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
          {wait > 0 ? `Reenviar en ${wait}s` : 'Reenviar código'}
        </button>
      </div>
    </div>
  )
}
