import { useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Boton } from '@/components/ui/Boton'
import { Campo } from '@/components/ui/Campo'
import { HttpError } from '@/lib/http'
import { useAccionSinRepetir } from '@/lib/useAccionSinRepetir'
import { CLAVE_SESION, iniciarSesion } from './api'
import { useSesion } from './hooks'

type Credenciales = { email: string; clave: string }

export function LoginPage() {
  const sesion = useSesion()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const entrar = useAccionSinRepetir(async ({ email, clave }: Credenciales) => {
    const nuevaSesion = await iniciarSesion(email, clave)
    queryClient.setQueryData(CLAVE_SESION, nuevaSesion)
    navigate('/admin')
  })

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    entrar.ejecutar({ email: String(campos.get('email')), clave: String(campos.get('clave')) })
  }

  // Si ya inició sesión, no tiene sentido mostrarle el formulario.
  if (sesion.data) return <Navigate to="/admin" replace />

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">Panel del negocio</h1>
          <p className="text-sm text-gray-500">Ingresa para ver tu agenda.</p>
        </div>

        <Campo etiqueta="Email">
          <input name="email" type="email" required autoComplete="username" />
        </Campo>
        <Campo etiqueta="Clave">
          <input name="clave" type="password" required autoComplete="current-password" />
        </Campo>

        {entrar.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {entrar.error instanceof HttpError && entrar.error.status === 401
              ? 'Email o clave incorrectos.'
              : 'No pudimos iniciar sesión. Intenta de nuevo.'}
          </p>
        )}

        <Boton type="submit" disabled={entrar.bloqueada} className="w-full">
          {entrar.bloqueada ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>
    </div>
  )
}
