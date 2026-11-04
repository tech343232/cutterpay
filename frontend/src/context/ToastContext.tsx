import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'success' | 'error'
interface Toast {
  id: number
  tone: Tone
  title: string
  text?: string
}

const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = (id: number) => setToasts((all) => all.filter((t) => t.id !== id))

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((all) => [...all.slice(-2), { ...t, id }])
    setTimeout(() => dismiss(id), 4500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border bg-surface/95 p-4 shadow-card backdrop-blur',
              t.tone === 'success' ? 'border-ok/30' : 'border-bad/40',
            )}
          >
            {t.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-bad" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.text && <p className="mt-0.5 text-sm text-muted">{t.text}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-muted hover:text-fg" aria-label="Cerrar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
