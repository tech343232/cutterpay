import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm?: () => void
  loading?: boolean
}

/** Diálogo accesible con confirmación (Escape y clic afuera cierran). */
export function Modal({ open, title, children, onClose, confirmLabel, confirmVariant = 'primary', onConfirm, loading }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        if (!loading) onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current && !loading) onClose()
      }}
      className="m-auto w-[min(92vw,440px)] rounded-3xl border border-line bg-surface p-0 text-fg shadow-card backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} disabled={loading} className="rounded-xl p-1.5 text-muted hover:bg-surface2 hover:text-fg" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-muted">{children}</div>
        {onConfirm && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
              {confirmLabel || 'Confirmar'}
            </Button>
          </div>
        )}
      </div>
    </dialog>
  )
}
