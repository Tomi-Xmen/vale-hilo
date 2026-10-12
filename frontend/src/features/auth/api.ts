import { get, HttpError, post } from '@/lib/http'

export type Sesion = { email: string }

export const CLAVE_SESION = ['sesion']

/** La sesión actual de la dueña, o null si no ha iniciado sesión. */
export async function getSesion(): Promise<Sesion | null> {
  try {
    return await get<Sesion>('/auth/sesion')
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) return null
    throw error
  }
}

export const iniciarSesion = (email: string, clave: string) =>
  post<Sesion>('/auth/login', { email, clave })

export const cerrarSesion = () => post<void>('/auth/logout', {})
