import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/** 6 casillas para el código del correo. Acepta pegar el código completo y se llena solo en celulares. */
export function CodeInput({ value, onChange, onComplete, invalid, disabled, autoFocus = true }: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  invalid?: boolean
  disabled?: boolean
  autoFocus?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, 6)
    onChange(clean)
    if (clean.length === 6) onComplete?.(clean)
    return clean
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Código de 6 dígitos">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          id={i === 0 ? 'otp-code' : undefined}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          aria-label={`Dígito ${i + 1}`}
          aria-invalid={invalid}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, '')
            if (!typed) return
            if (typed.length > 1) {
              // pegó o el celular llenó el código completo
              const clean = set(typed)
              refs.current[Math.min(clean.length, 5)]?.focus()
              return
            }
            const arr = digits.slice()
            arr[i] = typed
            set(arr.join(''))
            refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              const arr = digits.slice()
              if (arr[i]) arr[i] = ''
              else if (i > 0) {
                arr[i - 1] = ''
                refs.current[i - 1]?.focus()
              }
              onChange(arr.join('').slice(0, 6))
            }
            if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight') refs.current[i + 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const clean = set(e.clipboardData.getData('text'))
            refs.current[Math.min(clean.length, 5)]?.focus()
          }}
          className={cn(
            'tabular h-14 w-full min-w-0 rounded-2xl border bg-bg/60 text-center font-display text-2xl font-bold text-fg transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 sm:h-16',
            invalid ? 'border-bad/70' : d ? 'border-primary/60' : 'border-line',
          )}
        />
      ))}
    </div>
  )
}
