import { CreditCard, Wand2, Wallet as WalletIcon } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { TEST_CARDS } from '@/lib/mock-data'
import { usd } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface CardData {
  holder: string
  cardNumber: string
  expiry: string
  cvc: string
}

const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

/** Elegir cómo pagar una compra: con el saldo o con tarjeta de crédito/débito. */
export function CardPay({
  payWith, setPayWith, balance, amount, card, setCard, errors, demo, holderName,
}: {
  payWith: 'saldo' | 'tarjeta'
  setPayWith: (v: 'saldo' | 'tarjeta') => void
  balance: number
  amount: number
  card: CardData
  setCard: (c: CardData) => void
  errors: Record<string, string>
  /** Cuenta de prueba: muestra la tarjeta de prueba y el botón para autocompletar */
  demo: boolean
  holderName: string
}) {
  const enough = balance >= amount
  const autofill = () => setCard({ holder: holderName, cardNumber: TEST_CARDS[0].number, expiry: '12/29', cvc: '123' })

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-muted">¿Cómo quieres pagar?</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!enough}
          onClick={() => setPayWith('saldo')}
          aria-pressed={payWith === 'saldo'}
          className={cn('flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition disabled:opacity-40', payWith === 'saldo' ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-line hover:border-primary/40')}
        >
          <WalletIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold">Mi saldo</span>
          <span className="text-xs text-muted">{enough ? `Tienes ${usd(balance)}` : `Solo tienes ${usd(balance)}`}</span>
        </button>
        <button
          type="button"
          onClick={() => setPayWith('tarjeta')}
          aria-pressed={payWith === 'tarjeta'}
          className={cn('flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition', payWith === 'tarjeta' ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-line hover:border-primary/40')}
        >
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="font-semibold">Tarjeta</span>
          <span className="text-xs text-muted">Crédito o débito</span>
        </button>
      </div>

      {payWith === 'tarjeta' && (
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-bg/50 p-4">
          {demo && (
            <button
              type="button"
              onClick={autofill}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/60 bg-primary/10 px-3 py-2.5 text-sm font-bold text-primary hover:bg-primary/20"
            >
              <Wand2 className="h-4 w-4" /> Autocompletar con tarjeta de prueba
            </button>
          )}
          <Input label="Nombre en la tarjeta" id="cp-holder" autoComplete="cc-name" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} error={errors.holder} />
          <Input label="Número de tarjeta" id="cp-number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: formatCard(e.target.value) })} error={errors.cardNumber} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Vence" id="cp-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} error={errors.expiry} />
            <Input label="CVC" id="cp-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={3} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })} error={errors.cvc} />
          </div>
          {demo && <p className="text-xs text-muted">Tarjeta de prueba: <b>{TEST_CARDS[0].number}</b> (aprobada) · <b>{TEST_CARDS[1].number}</b> (rechazada)</p>}
        </div>
      )}
    </div>
  )
}
