import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { DEMO_ACCOUNTS } from '@/lib/mock-data'
import { firstName } from '@/lib/format'
import { primeAudio, playWelcome } from '@/lib/sound'
import { markWelcome } from '@/components/motion/WelcomeOverlay'
import { LogoIcon } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'

const MODES = {
  usuario: { account: DEMO_ACCOUNTS[0], label: 'Entrando como Sofía (usuaria)', to: '/app' },
  admin: { account: DEMO_ACCOUNTS[1], label: 'Entrando como administrador', to: '/admin' },
} as const

/**
 * Acceso directo para probar CUTTERPAY sin escribir nada:
 *   /demo/usuario → Sofía (comprar, vender, fondos)
 *   /demo/admin   → administrador (usuarios, suspender, reportes)
 * Solo funciona con las cuentas de demostración, cuyo código aparece en pantalla.
 */
export default function DemoLogin() {
  const { mode } = useParams()
  const navigate = useNavigate()
  const { login, verify, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)
  const cfg = MODES[(mode as keyof typeof MODES) ?? 'usuario'] ?? null

  useEffect(() => {
    if (!cfg || started.current) return
    started.current = true
    ;(async () => {
      try {
        logout()
        const challenge = await login(cfg.account.email, cfg.account.password)
        if (!challenge.demoCode) throw new Error('Esta cuenta no es de demostración.')
        const { user } = await verify(challenge.challengeId, challenge.demoCode)
        markWelcome(firstName(user.name), user.role === 'admin' ? 'admin' : 'login')
        primeAudio()
        playWelcome()
        navigate(cfg.to, { replace: true })
      } catch (e) {
        setError(e instanceof ApiError || e instanceof Error ? e.message : 'No pudimos entrar. Intenta de nuevo.')
      }
    })()
  }, [cfg, login, verify, logout, navigate])

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-5 text-center">
        <LogoIcon size={96} animated glow />
        {!cfg ? (
          <>
            <p className="font-display text-2xl font-bold">Ese acceso no existe</p>
            <p className="text-muted">Usa /demo/usuario o /demo/admin.</p>
            <Link to="/login"><Button>Ir a iniciar sesión</Button></Link>
          </>
        ) : error ? (
          <>
            <p className="font-display text-2xl font-bold">No pudimos entrar</p>
            <p className="text-muted">{error}</p>
            <Link to="/login"><Button>Ir a iniciar sesión</Button></Link>
          </>
        ) : (
          <>
            <p className="font-display text-2xl font-bold">{cfg.label}…</p>
            <p className="text-muted">Modo de prueba: no necesitas escribir correo, contraseña ni código.</p>
            <span className="h-1.5 w-40 overflow-hidden rounded-full bg-surface2">
              <span className="block h-full w-1/2 animate-pulse rounded-full bg-aurora" />
            </span>
          </>
        )}
      </div>
    </div>
  )
}
