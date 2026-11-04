import { useState } from 'react'
import { IdCard, Lock } from 'lucide-react'
import { dpiSchema } from '@shared/validation.js'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/** Formato visual del DPI: 0000 00000 0000 */
const formatDpi = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 13)
  return [d.slice(0, 4), d.slice(4, 9), d.slice(9, 13)].filter(Boolean).join(' ')
}

/** Se muestra la primera vez que alguien quiere retirar dinero: verifica su identidad con el DPI. */
export function DpiStep({ onDone }: { onDone: () => void }) {
  const { markDpi } = useAuth()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = dpiSchema.safeParse({ dpi: value })
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setSaving(true)
    setError(null)
    try {
      await api('/perfil/dpi', { method: 'POST', body: { dpi: parsed.data.dpi } })
      markDpi()
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.fieldErrors?.dpi || err.message : 'No pudimos guardar tu DPI. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-aurora text-white"><IdCard className="h-6 w-6" /></span>
        <div>
          <p className="font-display text-xl font-bold">Verifica tu identidad</p>
          <p className="text-sm text-muted">Antes de tu primer retiro necesitamos tu DPI. Solo lo pedimos una vez.</p>
        </div>
      </div>
      <Input
        label="Número de DPI"
        id="dpi"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0000 00000 0000"
        value={value}
        onChange={(e) => {
          setValue(formatDpi(e.target.value))
          setError(null)
        }}
        error={error || undefined}
        hint="Son los 13 números que aparecen en tu documento."
      />
      <Button type="submit" size="lg" loading={saving}>
        {saving ? 'Verificando…' : 'Verificar y continuar'}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <Lock className="h-3.5 w-3.5" /> Tu DPI se guarda protegido y nadie más puede usarlo.
      </p>
    </form>
  )
}
