import type { ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface2', className)} />
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-3xl border border-bad/25 bg-bad/5 p-6 text-center', className)}>
      <AlertTriangle className="h-6 w-6 text-bad" />
      <p className="max-w-md text-sm">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          <RotateCw className="h-4 w-4" /> Reintentar
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, text, action, className }: { icon: ReactNode; title: string; text: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center', className)}>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted">{text}</p>
      {action}
    </div>
  )
}

type Tone = 'ok' | 'bad' | 'warn' | 'primary' | 'muted'
const tones: Record<Tone, string> = {
  ok: 'bg-ok/10 text-ok border-ok/25',
  bad: 'bg-bad/10 text-bad border-bad/25',
  warn: 'bg-warn/10 text-warn border-warn/25',
  primary: 'bg-primary/10 text-primary border-primary/25',
  muted: 'bg-surface2 text-muted border-line',
}

export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Change({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span className={cn('tabular inline-flex items-center gap-0.5 whitespace-nowrap font-semibold', up ? 'text-ok' : 'text-bad', className)}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  )
}
