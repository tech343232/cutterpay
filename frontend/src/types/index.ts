export type Role = 'usuario' | 'admin'
export type AccountStatus = 'activo' | 'suspendido' | 'baja'
export type TradeType = 'compra' | 'venta'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: AccountStatus
  hasDpi?: boolean
}

export interface Coin {
  id: number
  name: string
  symbol: string
  color: string
  active: boolean
  price: number
  open24h: number
  high24h: number
  low24h: number
  change24h: number
  spark: number[]
  updatedAt: string
}

export interface PricePoint {
  t: string
  p: number
}

export interface Holding {
  symbol: string
  name: string
  color: string
  price: number
  quantity: number
  avgCost: number
  value: number
  cost: number
  pnl: number
  pnlPct: number
}

export interface Fund {
  id: number
  name: string
  slug: string
  description: string
  rate: number
  risk: 'bajo' | 'medio' | 'alto'
  color: string
  active: boolean
  investors: number
}

export interface ReferenceRate {
  product: string
  rate: number
  note: string
}

export interface FundPosition {
  fundId: number
  slug: string
  name: string
  color: string
  rate: number
  invested: number
  value: number
  gain: number
  perSecond: number
}

export interface UserFunds {
  positions: FundPosition[]
  value: number
  invested: number
  gain: number
  perSecond: number
  serverTime: string
}

export interface FundMovement {
  id: number
  type: 'deposito' | 'retiro'
  amount: number
  gain: number | null
  date: string
  fund: string
  slug: string
  color: string
}

export interface Wallet {
  balance: number
  holdings: Holding[]
  cryptoValue: number
  invested: number
  unrealized: number
  funds: UserFunds
  fundsValue: number
  totalValue: number
}

export interface Transaction {
  id: number
  type: TradeType
  symbol: string
  name: string
  color: string
  quantity: number
  price: number
  total: number
  gain: number | null
  date: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pages: number
}

export interface ActivityDay {
  day: string
  buys: number
  sells: number
  buyUsd: number
  sellUsd: number
}

export interface CoinVolume {
  symbol: string
  color: string
  buyUsd: number
  sellUsd: number
  count: number
}

export interface MyReport {
  wallet: Wallet
  activity: ActivityDay[]
  byCoin: CoinVolume[]
  totals: { count: number; buys: number; sells: number; realized: number; recharged: number; fundsRealized: number }
}

export interface Recharge {
  id: number
  amount: number
  last4: string
  status: 'aprobada' | 'rechazada'
  date: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: Role
  status: AccountStatus
  createdAt: string
  lastLogin: string | null
  balance: number
  txCount: number
  volume: number
  cryptoValue: number
}

export interface AdminSummary {
  users: { total: number; active: number; suspended: number; closed: number; newThisWeek: number }
  money: { walletUsd: number; cryptoUsd: number; rechargedUsd: number; fundsUsd: number }
  transactions: { total: number; buys: number; sells: number; buyUsd: number; sellUsd: number; today: number }
  activity: ActivityDay[]
}

export interface CoinReportRow {
  id: number
  name: string
  symbol: string
  color: string
  active: boolean
  price: number
  buys: number
  sells: number
  buyQty: number
  sellQty: number
  buyUsd: number
  sellUsd: number
}

export interface TopUser {
  id: number
  name: string
  email: string
  status: AccountStatus
  txCount: number
  buys: number
  sells: number
  volume: number
  lastTx: string
}

export interface AuditEntry {
  action: string
  ip: string | null
  date: string
}
