// Cliente HTTP único de la app: timeout, token y errores en lenguaje humano.
const TOKEN_KEY = 'cp_token'
const TIMEOUT_MS = 12000

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>
  code?: string
  constructor(message: string, status: number, fieldErrors?: Record<string, string>, code?: string) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code
  }
}

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set: (t: string) => {
    try { localStorage.setItem(TOKEN_KEY, t) } catch { /* modo privado */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* modo privado */ }
  },
}

const FALLBACK: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'Inicia sesión para continuar.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscas.',
  429: 'Demasiados intentos. Espera un momento.',
  500: 'Algo salió mal en el servidor. Intenta de nuevo.',
}

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

export async function api<T>(path: string, { method = 'GET', body, signal, headers: extra }: Options = {}): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort('timeout'), TIMEOUT_MS)
  signal?.addEventListener('abort', () => ctrl.abort(signal.reason))

  const headers: Record<string, string> = { Accept: 'application/json', ...extra }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
  } catch (e) {
    if (signal?.aborted) throw e
    if (ctrl.signal.aborted) throw new ApiError('El servidor tardó demasiado en responder. Revisa tu conexión e intenta de nuevo.', 0)
    throw new ApiError('No pudimos conectar con CUTTERPAY. Revisa que el servidor esté encendido.', 0)
  } finally {
    clearTimeout(timer)
  }

  let data: any = null
  try { data = await res.json() } catch { /* respuesta vacía */ }

  if (!res.ok) {
    if (res.status === 401 || data?.code === 'ACCOUNT_SUSPENDED' || data?.code === 'ACCOUNT_CLOSED') {
      if (token) window.dispatchEvent(new CustomEvent('cp:session-ended', { detail: data?.error }))
    }
    throw new ApiError(data?.error || FALLBACK[res.status] || FALLBACK[500], res.status, data?.fieldErrors, data?.code)
  }
  return data as T
}

/** Avisa a las pantallas que el saldo o el portafolio cambió (compra, venta, recarga). */
export const emitWalletChanged = () => window.dispatchEvent(new Event('cp:wallet-changed'))
