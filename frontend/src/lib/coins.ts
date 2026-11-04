// Explicación de cada moneda en palabras simples (para principiantes).
export const COIN_INFO: Record<string, { short: string; moves: string; tone: 'ok' | 'warn' | 'bad'; recommended?: boolean }> = {
  BTC: { short: 'La más conocida del mundo. Ideal para empezar.', moves: 'Se mueve poco', tone: 'ok', recommended: true },
  ETH: { short: 'La segunda más grande. Muchos la eligen a largo plazo.', moves: 'Se mueve más', tone: 'warn' },
  DOGE: { short: 'Cuesta centavos: con $1 tienes varias monedas.', moves: 'Se mueve mucho', tone: 'bad' },
}
