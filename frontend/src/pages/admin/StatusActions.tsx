import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Feedback'
import type { AccountStatus } from '@/types'

export function StatusBadge({ status }: { status: AccountStatus }) {
  if (status === 'activo') return <Badge tone="ok">Activo</Badge>
  if (status === 'suspendido') return <Badge tone="warn">Suspendido</Badge>
  return <Badge tone="bad">De baja</Badge>
}

const COPY: Record<AccountStatus, { label: string; title: string; text: string; danger: boolean; done: string }> = {
  suspendido: {
    label: 'Suspender',
    title: '¿Suspender esta cuenta?',
    text: 'No podrá iniciar sesión ni operar. Su saldo y sus monedas se conservan y puedes reactivarla cuando quieras.',
    danger: true,
    done: 'Cuenta suspendida',
  },
  baja: {
    label: 'Dar de baja',
    title: '¿Dar de baja esta cuenta?',
    text: 'La cuenta queda cerrada. Sus transacciones se conservan para los reportes. Puedes reactivarla después si fue un error.',
    danger: true,
    done: 'Cuenta dada de baja',
  },
  activo: {
    label: 'Reactivar',
    title: '¿Reactivar esta cuenta?',
    text: 'Podrá volver a iniciar sesión y operar con su saldo actual.',
    danger: false,
    done: 'Cuenta reactivada',
  },
}

/** Botones Suspender / Dar de baja / Reactivar con confirmación. */
export function StatusActions({ userId, name, status, onChanged }: { userId: number; name: string; status: AccountStatus; onChanged: () => void }) {
  const toast = useToast()
  const [next, setNext] = useState<AccountStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const options: AccountStatus[] = status === 'activo' ? ['suspendido', 'baja'] : status === 'suspendido' ? ['activo', 'baja'] : ['activo']

  const confirm = async () => {
    if (!next) return
    setSaving(true)
    try {
      await api(`/admin/usuarios/${userId}/estado`, { method: 'PATCH', body: { status: next } })
      toast({ tone: 'success', title: COPY[next].done, text: name })
      setNext(null)
      onChanged()
    } catch (e) {
      toast({ tone: 'error', title: 'No se pudo cambiar el estado', text: e instanceof ApiError ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => setNext(o)}
            className={
              COPY[o].danger
                ? 'rounded-xl border border-bad/30 px-2.5 py-1.5 text-xs font-bold text-bad hover:bg-bad/10'
                : 'rounded-xl border border-ok/30 px-2.5 py-1.5 text-xs font-bold text-ok hover:bg-ok/10'
            }
          >
            {COPY[o].label}
          </button>
        ))}
      </div>
      <Modal
        open={!!next}
        title={next ? COPY[next].title : ''}
        onClose={() => setNext(null)}
        onConfirm={confirm}
        loading={saving}
        confirmLabel={next ? COPY[next].label : ''}
        confirmVariant={next && COPY[next].danger ? 'danger' : 'primary'}
      >
        <p className="mb-2 font-semibold text-fg">{name}</p>
        {next && COPY[next].text}
      </Modal>
    </>
  )
}
