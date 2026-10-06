const BASE_URL = '/api'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new HttpError(response.status, `GET ${path} respondió ${response.status}`)
  }
  return response.json() as Promise<T>
}
