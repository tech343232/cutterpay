import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '@/lib/api'
import type { User } from '@/types'
import type { Challenge } from '@/components/security/VerifyCode'

type Status = 'checking' | 'authed' | 'anon'

interface RegisterInput {
  name: string
  email: string
  dpi?: string
  password: string
}

interface AuthValue {
  user: User | null
  status: Status
  /** Mensaje cuando la sesión terminó sola (expiró o la cuenta fue suspendida). */
  endedReason: string | null
  login: (email: string, password: string) => Promise<Challenge>
  register: (input: RegisterInput) => Promise<Challenge>
  verify: (challengeId: string, code: string) => Promise<{ user: User; firstTime: boolean }>
  logout: () => void
  /** Marca que ya verificó su identidad con DPI */
  markDpi: () => void
  /** Marca que ya vio la guía de bienvenida */
  markOnboarded: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>(tokenStore.get() ? 'checking' : 'anon')
  const [endedReason, setEndedReason] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenStore.get()) return
    api<{ user: User }>('/auth/yo')
      .then((r) => {
        setUser(r.user)
        setStatus('authed')
      })
      .catch(() => {
        tokenStore.clear()
        setStatus('anon')
      })
  }, [])

  useEffect(() => {
    const onEnded = (e: Event) => {
      tokenStore.clear()
      setUser(null)
      setStatus('anon')
      setEndedReason((e as CustomEvent<string>).detail || 'Tu sesión terminó. Inicia sesión otra vez.')
    }
    window.addEventListener('cp:session-ended', onEnded)
    return () => window.removeEventListener('cp:session-ended', onEnded)
  }, [])

  const login = useCallback((email: string, password: string) => api<Challenge>('/auth/login', { method: 'POST', body: { email, password } }), [])

  const register = useCallback((input: RegisterInput) => api<Challenge>('/auth/registro', { method: 'POST', body: input }), [])

  // Segundo paso: el código del correo confirma que el correo es real y abre la sesión
  const verify = useCallback(async (challengeId: string, code: string) => {
    const r = await api<{ token: string; user: User; firstTime: boolean }>('/auth/verificar', { method: 'POST', body: { challengeId, code } })
    tokenStore.set(r.token)
    setUser(r.user)
    setStatus('authed')
    setEndedReason(null)
    return { user: r.user, firstTime: r.firstTime }
  }, [])

  const markDpi = useCallback(() => setUser((u) => (u ? { ...u, hasDpi: true } : u)), [])
  const markOnboarded = useCallback(() => setUser((u) => (u ? { ...u, onboarded: true } : u)), [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anon')
  }, [])

  const value = useMemo(() => ({ user, status, endedReason, login, register, verify, logout, markDpi, markOnboarded }), [user, status, endedReason, login, register, verify, logout, markDpi, markOnboarded])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
