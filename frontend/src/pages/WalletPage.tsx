import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { CreditCard, Lock, AlertCircle, ArrowUpFromLine, ArrowDownToLine, ListOrdered } from 'lucide-react'
import { CashOut } from '@/components/cashout/CashOut'
import { rechargeSchema, LIMITS } from '@shared/validation.js'
import { api, ApiError, emitWalletChanged } from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { useWallet } from '@/hooks/useMarket'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader, Segmented } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, Skeleton, EmptyState } from '@/components/ui/Feedback'
import { LogoIcon } from '@/components/brand/Logo'
import { TEST_CARDS } from '@/lib/mock-data'
import { usd, dateTime } from '@/lib/format'
import type { Recharge } from '@/types'

type Tab = 'retirar' | 'recargar' | 'movimientos'
interface Withdrawal { id: number; method: string; amount: number; destination: string; code: string | null; pin: string | null; expiresAt: string | null; date: string }

type Form = z.input<typeof rechargeSchema>
const QUICK = [100, 500, 1000, 2500]

const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export default function WalletPage() {
  const toast = useToast()
  const { user } = useAuth()
  const wallet = useWallet()
  const recharges = useApi<{ items: Recharge[] }>('/billetera/recargas', { refreshOn: ['cp:wallet-changed'] })
  const withdrawals = useApi<{ items: Withdrawal[] }>('/billetera/retiros', { refreshOn: ['cp:wallet-changed'] })
  const [tab, setTab] = useState<Tab>('retirar')
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(rechargeSchema), mode: 'onTouched', defaultValues: { amount: 500, holder: user?.name || '' } })
  const card = watch('cardNumber') || ''

  const onSubmit = async (data: Form) => {
    setServerError(null)
    try {
      const r = await api<{ balance: number; amount: number; last4: string }>('/billetera/recargar', { method: 'POST', body: data })
      toast({ tone: 'success', title: `Recargaste ${usd(r.amount)}`, text: `Tarjeta •••• ${r.last4}. Nuevo saldo: ${usd(r.balance)}.` })
      reset({ amount: 500, holder: data.holder, cardNumber: '', expiry: '', cvc: '' })
      emitWalletChanged()
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, m]) => setError(k as keyof Form, { message: m }))
      setServerError(e instanceof ApiError ? e.message : 'No se pudo procesar la recarga.')
      recharges.reload()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Billetera" subtitle={<>Saca tu dinero <b className="text-fg">cuando quieras</b> o agrega saldo.</>} />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        className="w-full sm:w-auto"
        options={[
          { value: 'retirar', label: <span className="flex items-center justify-center gap-1.5"><ArrowUpFromLine className="h-4 w-4" /> Retirar</span> },
          { value: 'recargar', label: <span className="flex items-center justify-center gap-1.5"><ArrowDownToLine className="h-4 w-4" /> Recargar</span> },
          { value: 'movimientos', label: <span className="flex items-center justify-center gap-1.5"><ListOrdered className="h-4 w-4" /> Movimientos</span> },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-4xl bg-aurora p-6 text-white shadow-glow">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white/80">Saldo disponible</p>
                <p className="tabular mt-1 font-display text-4xl font-extrabold">{wallet.data ? usd(wallet.data.balance) : '—'}</p>
              </div>
              <LogoIcon size={44} />
            </div>
            <div className="relative mt-8 flex items-end justify-between text-sm">
              <div>
                <p className="text-white/70">Titular</p>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <p className="font-mono text-white/80">USD</p>
            </div>
          </div>

          {tab === 'movimientos' && (
          <Card>
            <CardHeader title="Recargas recientes" />
            {recharges.loading || !recharges.data ? (
              <Skeleton className="h-32" />
            ) : recharges.data.items.length === 0 ? (
              <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Sin recargas todavía" text="Si se te acaba el saldo de práctica, puedes recargar con una tarjeta de prueba." className="py-6" />
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {recharges.data.items.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold">Tarjeta •••• {r.last4}</p>
                      <p className="text-xs text-muted">{dateTime(r.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={r.status === 'aprobada' ? 'ok' : 'bad'}>{r.status}</Badge>
                      <span className="tabular w-24 text-right font-semibold">{usd(r.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          )}
        </div>

        {tab === 'retirar' && (
          <Card>
            <CashOut balance={wallet.data?.balance ?? 0} />
          </Card>
        )}

        {tab === 'movimientos' && (
          <Card>
            <CardHeader title="Retiros" />
            {!withdrawals.data ? (
              <Skeleton className="h-32" />
            ) : withdrawals.data.items.length === 0 ? (
              <EmptyState icon={<ArrowUpFromLine className="h-6 w-6" />} title="Aún no retiras dinero" text="Cuando retires, aquí verás a dónde fue y el código si elegiste cajero." className="py-6" />
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {withdrawals.data.items.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.destination}</p>
                      <p className="text-xs text-muted">{dateTime(r.date)}{r.code && <> · código <b className="tabular text-fg">{r.code.slice(0, 4)} {r.code.slice(4)}</b> · PIN <b className="tabular text-fg">{r.pin}</b></>}</p>
                    </div>
                    <span className="tabular shrink-0 font-semibold">−{usd(r.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'recargar' && (
        <Card>
          <CardHeader title="Recargar saldo" subtitle="Agrega saldo con tarjeta en segundos." />
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {serverError && (
              <div role="alert" className="flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 p-3 text-sm text-bad">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}
            <div>
              <Input label="Monto (USD)" inputMode="decimal" {...register('amount')} error={errors.amount?.message} hint={`Entre ${usd(LIMITS.rechargeMin)} y ${usd(LIMITS.rechargeMax)}`} />
              <div className="mt-2 grid grid-cols-4 gap-2">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => setValue('amount', q, { shouldValidate: true })} className="rounded-xl border border-line py-1.5 text-xs font-bold text-muted hover:border-primary/50 hover:text-fg">
                    ${q.toLocaleString('en-US')}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Nombre en la tarjeta" autoComplete="cc-name" {...register('holder')} error={errors.holder?.message} />
            <Input
              label="Número de tarjeta"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              {...register('cardNumber', { onChange: (e) => setValue('cardNumber', formatCard(e.target.value)) })}
              value={card}
              error={errors.cardNumber?.message}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Vence" placeholder="MM/AA" inputMode="numeric" autoComplete="cc-exp" {...register('expiry', { onChange: (e) => setValue('expiry', formatExpiry(e.target.value)) })} error={errors.expiry?.message} />
              <Input label="CVC" placeholder="123" inputMode="numeric" maxLength={3} autoComplete="cc-csc" {...register('cvc')} error={errors.cvc?.message} />
            </div>
            <Button type="submit" size="lg" loading={isSubmitting}>
              {isSubmitting ? 'Procesando pago…' : (
                <>
                  <Lock className="h-4 w-4" /> Recargar saldo
                </>
              )}
            </Button>
            <div className="rounded-2xl bg-bg/60 p-3 text-xs text-muted">
              <p className="mb-1 font-bold uppercase tracking-wider">Tarjetas de prueba</p>
              {TEST_CARDS.map((c) => (
                <button key={c.number} type="button" onClick={() => setValue('cardNumber', c.number, { shouldValidate: true })} className="mr-3 font-mono hover:text-fg">
                  {c.number} → {c.result}
                </button>
              ))}
              <p className="mt-1">Cualquier fecha futura y cualquier CVC de 3 dígitos.</p>
            </div>
          </form>
        </Card>
        )}
      </div>
    </div>
  )
}
