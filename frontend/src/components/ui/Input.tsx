import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, suffix, id, className, type, ...props }, ref) {
  const [show, setShow] = useState(false)
  const inputId = id || props.name
  const isPassword = type === 'password'
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-fg/90">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-12 w-full rounded-2xl border bg-bg/60 px-4 text-[15px] text-fg placeholder:text-muted/60 transition tabular',
            'focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15',
            error ? 'border-bad/70' : 'border-line',
            (isPassword || suffix) && 'pr-12',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted hover:text-fg"
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {suffix && !isPassword && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-err`} role="alert" className="text-[13px] font-semibold text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
