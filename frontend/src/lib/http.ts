const BASE_URL = '/api'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function pedir<T>(
  metodo: 'GET' | 'POST' | 'PUT',
  path: string,
  cuerpo?: unknown,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: metodo,
    headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const datos = await response.json().catch(() => null)

  if (!response.ok) {
    // El backend explica el problema en `error`; si no, se usa un mensaje genérico.
    const mensaje = datos?.error ?? `${metodo} ${path} respondió ${response.status}`
    throw new HttpError(response.status, mensaje)
  }
  return datos as T
}

export const get = <T>(path: string) => pedir<T>('GET', path)

export const post = <T>(path: string, cuerpo: unknown) => pedir<T>('POST', path, cuerpo)

export const put = <T>(path: string, cuerpo: unknown) => pedir<T>('PUT', path, cuerpo)
