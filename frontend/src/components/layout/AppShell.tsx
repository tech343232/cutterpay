import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, LineChart, PieChart, History, BarChart3, Wallet, Users, ShieldCheck, FileBarChart, LogOut, PiggyBank,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import type { Wallet as WalletData } from "@/types"
import { Logo, LogoIcon } from '@/components/brand/Logo'
import { usd, firstName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { WelcomeOverlay } from '@/components/motion/WelcomeOverlay'

const USER_NAV = [
  { to: '/app', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/app/mercado', label: 'Cripto', icon: LineChart },
  { to: '/app/fondos', label: 'Fondos', icon: PiggyBank },
  { to: '/app/portafolio', label: 'Portafolio', icon: PieChart },
  { to: '/app/historial', label: 'Historial', icon: History },
  { to: '/app/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/app/billetera', label: 'Billetera', icon: Wallet, desktopOnly: true },
]

const ADMIN_NAV = [
  { to: '/admin', label: 'Resumen', icon: ShieldCheck, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
]

export function AppShell({ admin = false }: { admin?: boolean }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = admin ? ADMIN_NAV : USER_NAV
  const wallet = useApi<WalletData>(admin ? null : '/billetera', { pollMs: 10000, refreshOn: ['cp:wallet-changed'] })

  const doLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <WelcomeOverlay />
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface/60 p-5 backdrop-blur lg:flex">
        <NavLink to={admin ? '/admin' : '/app'} className="px-1"><Logo size={38} /></NavLink>
        {admin && <span className="-mt-3 w-fit rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">Administrador</span>}
        <nav className="flex flex-col gap-1" aria-label="Navegación principal">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] font-semibold transition',
                  isActive ? 'bg-aurora text-white shadow-glow' : 'text-muted hover:bg-surface2 hover:text-fg',
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          {!admin && wallet.data && (
            <div className="rounded-2xl border border-line bg-bg/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Saldo disponible</p>
              <p className="tabular mt-1 font-display text-xl font-bold">{usd(wallet.data.balance)}</p>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-2xl p-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">
              {user?.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <button onClick={doLogout} className="rounded-xl p-2 text-muted hover:bg-surface2 hover:text-bad" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Barra superior (celular) */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur lg:hidden"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <LogoIcon size={32} animated />
            <span className="font-display text-lg font-bold">{admin ? 'Admin' : `Hola, ${firstName(user?.name || '')}`}</span>
          </div>
          <div className="flex items-center gap-2">
            {!admin && wallet.data && (
              <NavLink to="/app/billetera" className="tabular rounded-full border border-line bg-surface px-3 py-1 text-sm font-bold" aria-label="Billetera, saldo disponible">
                {usd(wallet.data.balance)}
              </NavLink>
            )}
            <button onClick={doLogout} className="rounded-xl p-2 text-muted hover:text-bad" aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>

        {/* Navegación inferior (celular) */}
        <nav
          aria-label="Navegación"
          className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-surface/95 px-1 pt-1.5 backdrop-blur lg:hidden"
          style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
        >
          {nav.filter((n) => !('desktopOnly' in n)).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-semibold', isActive ? 'text-primary' : 'text-muted')
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
