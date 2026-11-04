import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { loginSchema } from '@shared/validation.js'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from './AuthLayout'
import { primeAudio, playWelcome } from '@/lib/sound'
import { markWelcome } from '@/components/motion/WelcomeOverlay'
import { firstName } from '@/lib/format'
import { VerifyCode, type Challenge } from '@/components/security/VerifyCode'
import { DemoCredentials } from '@/components/security/DemoCredentials'

interface Form {
  email: string
  password: string
}

type Variant = 'usuario' | 'tester' | 'admin'

const TEXT: Record<Variant, { title: string; sub: string; badge?: string }> = {
  usuario: { title: 'Hola de nuevo', sub: '' },
  tester: { title: 'Acceso de prueba', sub: 'Entra con la cuenta de Sofía para probar compras, ventas y retiros.', badge: 'Tester' },
  admin: { title: 'Panel de administración', sub: 'Acceso solo para administradores de CUTTERPAY.', badge: 'Administrador' },
}

export default function Login({ variant = 'usuario' }: { variant?: Variant }) {
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
      title={TEXT[variant].title}
      subtitle={
        variant === 'usuario' ? (
          <>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-primary hover:underline">
              Créala gratis
            </Link>
          </>
        ) : (
          <span className="flex flex-col gap-2">
            <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${variant === 'admin' ? 'border-warn/40 bg-warn/10 text-warn' : 'border-primary/40 bg-primary/10 text-primary'}`}>{TEXT[variant].badge}</span>
            {TEXT[variant].sub}
          </span>
        )
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

      {!challenge && variant !== 'usuario' && (
        <DemoCredentials
          only={variant}
          onUse={(email, password) => {
            setValue('email', email, { shouldValidate: true })
            setValue('password', password, { shouldValidate: true })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
    </AuthLayout>
  )
}
