import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LogoIcon } from '@/components/brand/Logo'

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <LogoIcon size={72} glow animated />
        <p className="text-sm text-muted">Cargando tu cuenta…</p>
      </div>
    </div>
  )
}

/** Rutas de usuario: exige sesión y manda al admin a su panel. */
export function UserRoute() {
  const { status, user } = useAuth()
  const loc = useLocation()
  if (status === 'checking') return <Splash />
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <Outlet />
}

/** Rutas de admin: exige sesión con rol admin. */
export function AdminRoute() {
  const { status, user } = useAuth()
  if (status === 'checking') return <Splash />
  if (status === 'anon') return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/app" replace />
  return <Outlet />
}

/** Login/registro: si ya hay sesión, lleva a su inicio. */
export function GuestRoute() {
  const { status, user } = useAuth()
  if (status === 'checking') return <Splash />
  if (status === 'authed') return <Navigate to={user?.role === 'admin' ? '/admin' : '/app'} replace />
  return <Outlet />
}
