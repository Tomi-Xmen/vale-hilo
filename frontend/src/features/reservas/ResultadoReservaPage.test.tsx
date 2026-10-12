import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { abrirApp, simularBackend, simularIdaAWebpay } from '@/test/utilidades'

const RESERVA = {
  id: 7,
  servicio_id: 1,
  servicio_nombre: 'Corte de pelo',
  inicio: '2026-10-12T10:00:00',
  fin: '2026-10-12T11:00:00',
  estado: 'pendiente_pago',
  monto_abono: 4500,
  expira_en: '2026-10-11T20:10:00',
  puede_pagar: true,
}

describe('Página de resultado de la reserva', () => {
  it('muestra la reserva confirmada', async () => {
    simularBackend({
      'GET /api/reservas/7': {
        body: { ...RESERVA, estado: 'confirmada', expira_en: null, puede_pagar: false },
      },
    })
    abrirApp('/reservas/7')

    expect(await screen.findByText('¡Reserva confirmada!')).toBeInTheDocument()
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument()
    expect(screen.getByText(/lunes, 12 de octubre/i)).toBeInTheDocument()
    expect(screen.getByText(/abono de \$4\.500/)).toBeInTheDocument()
  })

  it('si el pago no se completó, permite reintentar', async () => {
    simularBackend({
      'GET /api/reservas/7': { body: RESERVA },
      'POST /api/pagos': { status: 201, body: { url: 'https://webpay.falso', token: 'tok' } },
    })
    const idaAWebpay = simularIdaAWebpay()
    const usuario = userEvent.setup()
    abrirApp('/reservas/7')

    expect(await screen.findByText('El pago no se completó')).toBeInTheDocument()
    expect(screen.getByText(/hasta las 20:10/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Pagar abono/ }))
    await waitFor(() => expect(idaAWebpay).toHaveBeenCalledTimes(1))
  })

  it('doble click en reintentar crea un solo pago', async () => {
    const backend = simularBackend({
      'GET /api/reservas/7': { body: RESERVA },
      'POST /api/pagos': { status: 201, body: { url: 'https://webpay.falso', token: 'tok' } },
    })
    const idaAWebpay = simularIdaAWebpay()
    const usuario = userEvent.setup()
    abrirApp('/reservas/7')

    await usuario.dblClick(await screen.findByRole('button', { name: /Pagar abono/ }))

    await waitFor(() => expect(idaAWebpay).toHaveBeenCalled())
    expect(backend.vecesLlamada('POST /api/pagos')).toBe(1)
    expect(screen.getByRole('button', { name: /Redirigiendo/ })).toBeDisabled()
  })

  it('si se acabó el tiempo, ofrece elegir otra hora', async () => {
    simularBackend({
      'GET /api/reservas/7': { body: { ...RESERVA, puede_pagar: false } },
    })
    abrirApp('/reservas/7')

    expect(await screen.findByText('Se acabó el tiempo para pagar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Elegir otra hora' })).toHaveAttribute(
      'href',
      '/reservar/1',
    )
  })

  it('si la reserva no existe, lo dice', async () => {
    simularBackend({ 'GET /api/reservas/999': { status: 404, body: { error: 'No existe' } } })
    abrirApp('/reservas/999')

    expect(await screen.findByText('No encontramos esta reserva.')).toBeInTheDocument()
  })
})
