import { useState } from 'react'
import { Copy, Check, Eye, EyeOff, ShieldAlert, FlaskConical, KeyRound } from 'lucide-react'
import { DEMO_ACCOUNTS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* el navegador no dejó copiar: el texto queda visible para seleccionarlo */
        }
      }}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:border-primary/60 hover:text-fg"
      aria-label={`Copiar ${label}`}
    >
      {done ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

function Row({ k, v, secret }: { k: string; v: string; secret?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-16 shrink-0 sm:w-20 text-xs font-semibold uppercase tracking-wider text-muted">{k}</span>
      <code className={cn('min-w-0 flex-1 truncate rounded-lg bg-bg/70 px-2.5 py-1.5 font-mono text-xs sm:text-sm', secret && 'text-fg')}>{v}</code>
      <CopyBtn text={v} label={k} />
    </div>
  )
}

/**
 * Cuentas debajo del login:
 * - Prueba (Sofía): visible, para probar compras.
 * - Administrador: la contraseña semilla está oculta y solo se despliega después de una advertencia.
 */
export function DemoCredentials({ onUse, only }: { onUse: (email: string, password: string) => void; only: 'tester' | 'admin' }) {
  const [user, admin] = DEMO_ACCOUNTS
  const [warn, setWarn] = useState(false)
  const [reveal, setReveal] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {/* Prueba */}
      {only === 'tester' && <div className="rounded-3xl border border-line bg-surface/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-primary" /> Cuenta de prueba · Sofía</p>
          <button type="button" onClick={() => onUse(user.email, user.password)} className="rounded-xl bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/25">
            Usar esta cuenta
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <Row k="Correo" v={user.email} />
          <Row k="Clave" v={user.password} secret />
        </div>
      </div>}

      {/* Administrador */}
      {only === 'admin' && <div className="rounded-3xl border border-line bg-surface/70 p-4">
        <p className="mb-3 flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-warn" /> Administrador</p>
        <div className="flex flex-col gap-2">
          <Row k="Correo" v={admin.email} />
          {reveal ? (
            <>
              <Row k="Semilla" v={admin.password} secret />
              <div className="flex gap-2">
                <button type="button" onClick={() => onUse(admin.email, admin.password)} className="flex-1 rounded-xl bg-warn/15 px-3 py-2 text-xs font-bold text-warn hover:bg-warn/25">
                  Usar y entrar como admin
                </button>
                <button type="button" onClick={() => setReveal(false)} className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-bold text-muted hover:text-fg">
                  <EyeOff className="h-3.5 w-3.5" /> Ocultar
                </button>
              </div>
            </>
          ) : warn ? (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm">
              <p className="flex items-start gap-2 font-semibold text-warn">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /> Esta es la contraseña semilla del administrador.
              </p>
              <ul className="ml-7 flex list-disc flex-col gap-1 text-muted">
                <li><b>No la muestres a nadie.</b></li>
                <li>Si estás <b>compartiendo pantalla</b>, deja de compartir antes de verla.</li>
                <li>Luego ya puedes iniciar sesión.</li>
              </ul>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setReveal(true); setWarn(false) }} className="flex-1 rounded-xl bg-warn px-3 py-2 text-xs font-bold text-bg hover:brightness-110">
                  Entiendo, mostrarla
                </button>
                <button type="button" onClick={() => setWarn(false)} className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-muted hover:text-fg">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setWarn(true)} className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-warn/50 px-3 py-2.5 text-sm font-semibold text-warn hover:bg-warn/10">
              <Eye className="h-4 w-4" /> Mostrar contraseña semilla
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">Solo para cuando el administrador olvide su contraseña.</p>
      </div>}
    </div>
  )
}
