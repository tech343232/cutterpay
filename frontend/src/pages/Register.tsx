import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Check } from 'lucide-react'
import { registerSchema } from '@shared/validation.js'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/api'
import { INITIAL_BALANCE } from '@/lib/mock-data'
import { usd, firstName } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { AuthLayout } from './AuthLayout'
import { VerifyCode, type Challenge } from '@/components/security/VerifyCode'
import { primeAudio, playWelcome } from '@/lib/sound'
import { markWelcome } from '@/components/motion/WelcomeOverlay'

const formSchema = registerSchema
  .extend({ confirm: z.string().min(1, 'Repite tu contraseña.') })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden.' })

type Form = z.input<typeof formSchema>

const RULES = [
  { label: '8 caracteres o más', test: (p: string) => p.length >= 8 },
  { label: 'Una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un número', test: (p: string) => /\d/.test(p) },
]

export default function Register() {
  const { register: signUp, verify } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(formSchema), mode: 'onTouched' })
  const password = watch('password') || ''

  const onSubmit = async (data: Form) => {
    setServerError(null)
    primeAudio()
    try {
      setChallenge(await signUp({ name: data.name, email: data.email, dpi: data.dpi || '', password: data.password }))
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) {
        Object.entries(e.fieldErrors).forEach(([k, msg]) => setError(k as keyof Form, { message: msg }))
      }
      setServerError(e instanceof ApiError ? e.message : 'No pudimos crear tu cuenta. Intenta de nuevo.')
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle={
        <>
          Recibe {usd(INITIAL_BALANCE)} de práctica. ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      {challenge ? (
        <VerifyCode
          challenge={challenge}
          onChallenge={setChallenge}
          resendPath="/auth/reenviar"
          title="Confirma tu correo"
          hint="Para saber que este correo es tuyo, te enviamos un código de 6 dígitos a"
          submitLabel="Activar mi cuenta"
          onSubmit={async (code) => {
            primeAudio()
            const { user } = await verify(challenge.challengeId, code)
            markWelcome(firstName(user.name), 'registro')
            playWelcome()
            toast({ tone: 'success', title: `¡Listo, ${firstName(user.name)}!`, text: `Ya tienes ${usd(INITIAL_BALANCE)} listos para invertir.` })
            navigate('/app', { replace: true })
          }}
        />
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 p-3 text-sm text-bad">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}
        <Input label="Nombre completo" autoComplete="name" placeholder="Sofía Ramírez" {...register('name')} error={errors.name?.message} />
        <Input label="Correo" type="email" autoComplete="email" placeholder="sofia@correo.com" {...register('email')} error={errors.email?.message} />
        <Input label="DPI (opcional)" inputMode="numeric" maxLength={13} placeholder="13 dígitos" {...register('dpi')} error={errors.dpi?.message} />
        <div className="flex flex-col gap-2">
          <Input label="Contraseña" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {RULES.map((r) => {
              const ok = r.test(password)
              return (
                <li key={r.label} className={cn('flex items-center gap-1 font-semibold', ok ? 'text-ok' : 'text-muted')}>
                  <Check className={cn('h-3.5 w-3.5', !ok && 'opacity-30')} /> {r.label}
                </li>
              )
            })}
          </ul>
        </div>
        <Input label="Repite la contraseña" type="password" autoComplete="new-password" {...register('confirm')} error={errors.confirm?.message} />
        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
          {isSubmitting ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </Button>
        <p className="text-center text-xs text-muted">Nunca te pediremos datos de tu banco para empezar.</p>
      </form>
      )}
    </AuthLayout>
  )
}
