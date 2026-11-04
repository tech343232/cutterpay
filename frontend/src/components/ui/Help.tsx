import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * "?" con explicación en un globo (regla de SOHO: los encabezados muestran solo el nombre;
 * la explicación para principiantes va aquí). Funciona con mouse, teclado y toque.
 */
export function Help({ title, children, className, align = 'center' }: { title?: string; children: ReactNode; className?: string; align?: 'center' | 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className={cn('relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label={title ? `Qué significa: ${title}` : 'Más información'}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="grid h-[18px] w-[18px] place-items-center rounded-full border border-line bg-surface2 text-[11px] font-bold normal-case tracking-normal text-muted transition hover:border-primary/60 hover:text-fg"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'absolute top-full z-50 mt-2 w-64 rounded-2xl border border-primary/30 bg-surface p-3 text-left text-[13px] font-normal normal-case leading-snug tracking-normal text-fg shadow-card',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'left' && 'left-0',
            align === 'right' && 'right-0',
          )}
        >
          {title && <span className="mb-1 block font-display font-semibold">{title}</span>}
          <span className="block text-muted">{children}</span>
        </span>
      )}
    </span>
  )
}
