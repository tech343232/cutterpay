import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { loginSchema } from '@shared/validation.js'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { DEMO_ACCOUNTS } from '@/lib/mock-data'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from './AuthLayout'
import { primeAudio, playWelcome } from '@/lib/sound'
import { markWelcome } from '@/components/motion/WelcomeOverlay'
import { firstName } from '@/lib/format'
import { VerifyCode, type Challenge } from '@/components/security/VerifyCode'

interface Form {
  email: string
  password: string
}

export default function Login() {
  const { login, verify, endedReason } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const navigate = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }
  const [serverError, setServerError] = useState<string | null>(endedReason)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  const onSubmit = async (data: Form) => {
    setServerError(null)
    primeAudio()
    try {
      setChallenge(await login(data.email, data.password))
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'No pudimos iniciar sesión. Intenta de nuevo.')
    }
  }

  return (
    <AuthLayout
      title="Hola de nuevo"
      subtitle={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-primary hover:underline">
            Créala gratis
          </Link>
        </>
      }
    >
      {challenge ? (
        <div className="flex flex-col gap-4">
          <VerifyCode
            challenge={challenge}
            onChallenge={setChallenge}
            resendPath="/auth/reenviar"
            submitLabel="Entrar"
            onSubmit={async (code) => {
              primeAudio()
              const { user } = await verify(challenge.challengeId, code)
              markWelcome(firstName(user.name), user.role === 'admin' ? 'admin' : 'login')
              playWelcome()
              navigate(user.role === 'admin' ? '/admin' : loc.state?.from || '/app', { replace: true })
            }}
          />
          <button type="button" onClick={() => setChallenge(null)} className="text-sm font-semibold text-muted hover:text-fg">
            Usar otra cuenta
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 p-3 text-sm text-bad">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}
        <Input label="Correo" type="email" autoComplete="email" placeholder="sofia@correo.com" {...register('email')} error={errors.email?.message} />
        <Input label="Contraseña" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
          {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>
      )}

      {!challenge && <div className="rounded-2xl border border-dashed border-line p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Cuentas de demostración</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setValue('email', a.email, { shouldValidate: true })
                setValue('password', a.password, { shouldValidate: true })
              }}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-left text-xs hover:border-primary/50"
            >
              <span className="block font-bold">{a.label}</span>
              <span className="text-muted">{a.email}</span>
            </button>
          ))}
        </div>
      </div>}
    </AuthLayout>
  )
}
