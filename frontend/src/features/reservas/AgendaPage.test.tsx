import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { abrirApp, fijarHoy, simularBackend } from '@/test/utilidades'

const RESERVA_CONFIRMADA = {
  id: 7,
  servicio_nombre: 'Corte de pelo',
  inicio: '2026-10-12T10:00:00',
  fin: '2026-10-12T11:00:00',
  estado: 'confirmada',
  monto_abono: 4500,
  cliente_nombre: 'Ana Pérez',
  cliente_email: 'ana@correo.cl',
  cliente_telefono: '912345678',
}

type Respuesta = { status?: number; body: unknown }

function backendConUnaReserva(respuestaCancelar: Respuesta = { body: RESERVA_CONFIRMADA }) {
  return simularBackend({
    'GET /api/auth/sesion': { body: { email: 'duena@negocio.cl' } },
    'GET /api/admin/reservas': { body: [RESERVA_CONFIRMADA] },
    'POST /api/admin/reservas/7/cancelar': respuestaCancelar,
  })
}

describe('Agenda del panel', () => {
  beforeEach(() => {
    fijarHoy(new Date(2026, 9, 12, 9, 0)) // lunes 12 de octubre
  })

  it('muestra las reservas del día con el contacto del cliente', async () => {
    backendConUnaReserva()
    abrirApp('/admin')

    expect(await screen.findByText('Corte de pelo · Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText(/lunes, 12 de octubre/i)).toBeInTheDocument()
    expect(screen.getByText('1 reserva confirmada · $4.500 en abonos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/56912345678',
    )
  })

  it('cancelar devolviendo el abono, aunque se haga doble click, se envía una sola vez', async () => {
    const backend = backendConUnaReserva()
    const usuario = userEvent.setup()
    abrirApp('/admin')

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(screen.getByLabelText(/Devolver el abono \(\$4\.500\)/)).toBeChecked()
    await usuario.dblClick(screen.getByRole('button', { name: 'Sí, cancelar' }))

    await waitFor(() =>
      expect(backend.datosEnviados('POST /api/admin/reservas/7/cancelar')).toEqual([
        { devolver_abono: true },
      ]),
    )
  })

  it('se puede cancelar sin devolver el abono', async () => {
    const backend = backendConUnaReserva()
    const usuario = userEvent.setup()
    abrirApp('/admin')

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await usuario.click(screen.getByLabelText(/Devolver el abono/))
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    await waitFor(() =>
      expect(backend.datosEnviados('POST /api/admin/reservas/7/cancelar')).toEqual([
        { devolver_abono: false },
      ]),
    )
  })

  it('si Webpay no puede devolver el abono, lo avisa y permite reintentar', async () => {
    backendConUnaReserva({
      status: 502,
      body: { error: 'Webpay no pudo devolver el abono. La reserva no se canceló.' },
    })
    const usuario = userEvent.setup()
    abrirApp('/admin')

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText(/Webpay no pudo devolver el abono/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sí, cancelar' })).toBeEnabled()
  })
})
