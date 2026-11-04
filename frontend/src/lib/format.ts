const usdFmt = (min: number, max: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: min, maximumFractionDigits: max })

const usd2 = usdFmt(2, 2)
const usd4 = usdFmt(4, 4)

/** Dólares. Precios menores a $1 (como DOGE) muestran 4 decimales. */
export const usd = (n: number, opts: { price?: boolean } = {}) =>
  opts.price && Math.abs(n) < 1 ? usd4.format(n) : usd2.format(n)

export const signedUsd = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + usd2.format(Math.abs(n))

export const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`

/** Cantidad de cripto sin ceros sobrantes: 0.05000000 → 0.05 */
export const qty = (n: number) =>
  Number(n).toLocaleString('en-US', { maximumFractionDigits: n >= 1000 ? 2 : 8 })

export const compactUsd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n)

const dateFmt = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const timeFmt = new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit' })

export const date = (d: string | Date) => dateFmt.format(new Date(d))
export const dateTime = (d: string | Date) => dateTimeFmt.format(new Date(d))
export const time = (d: string | Date) => timeFmt.format(new Date(d))
export const shortDay = (iso: string) =>
  new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short' }).format(new Date(iso + 'T12:00:00'))

export const firstName = (full: string) => full.trim().split(/\s+/)[0]
