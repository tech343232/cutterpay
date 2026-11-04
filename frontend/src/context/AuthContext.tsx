import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '@/lib/api'
import type { User } from '@/types'

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
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => void
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

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } })
    tokenStore.set(r.token)
    setUser(r.user)
    setStatus('authed')
    setEndedReason(null)
    return r.user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const r = await api<{ token: string; user: User }>('/auth/registro', { method: 'POST', body: input })
    tokenStore.set(r.token)
    setUser(r.user)
    setStatus('authed')
    setEndedReason(null)
    return r.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anon')
  }, [])

  const value = useMemo(() => ({ user, status, endedReason, login, register, logout }), [user, status, endedReason, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
