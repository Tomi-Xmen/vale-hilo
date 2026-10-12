import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { abrirApp, simularBackend } from '@/test/utilidades'

const SIN_SESION = { status: 401, body: { error: 'Tienes que iniciar sesión' } }
const CON_SESION = { body: { email: 'duena@negocio.cl' } }

async function llenarLogin(usuario: ReturnType<typeof userEvent.setup>, clave: string) {
  await usuario.type(await screen.findByLabelText('Email'), 'duena@negocio.cl')
  await usuario.type(screen.getByLabelText('Clave'), clave)
  await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Inicio de sesión del panel', () => {
  it('sin sesión, el panel manda a iniciar sesión', async () => {
    simularBackend({ 'GET /api/auth/sesion': SIN_SESION })
    const { router } = abrirApp('/admin')

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
  })

  it('con email y clave correctos entra a la agenda', async () => {
    let inicioSesion = false
    const backend = simularBackend({
      'GET /api/auth/sesion': () => (inicioSesion ? CON_SESION : SIN_SESION),
      'POST /api/auth/login': () => {
        inicioSesion = true
        return CON_SESION
      },
      'GET /api/admin/reservas': { body: [] },
    })
    const usuario = userEvent.setup()
    const { router } = abrirApp('/admin/login')

    await llenarLogin(usuario, 'clave-correcta')

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
    expect(await screen.findByText('No hay reservas este día.')).toBeInTheDocument()
    expect(backend.datosEnviados('POST /api/auth/login')).toEqual([
      { email: 'duena@negocio.cl', clave: 'clave-correcta' },
    ])
  })

  it('con clave incorrecta muestra un aviso', async () => {
    simularBackend({
      'GET /api/auth/sesion': SIN_SESION,
      'POST /api/auth/login': { status: 401, body: { error: 'Email o clave incorrectos' } },
    })
    const usuario = userEvent.setup()
    abrirApp('/admin/login')

    await llenarLogin(usuario, 'clave-mala')

    expect(await screen.findByText('Email o clave incorrectos.')).toBeInTheDocument()
  })

  it('si la sesión expira mientras usa el panel, vuelve a iniciar sesión', async () => {
    simularBackend({
      'GET /api/auth/sesion': CON_SESION,
      'GET /api/admin/reservas': SIN_SESION, // el backend ya no reconoce la sesión
    })
    const { router } = abrirApp('/admin')

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
  })
})
