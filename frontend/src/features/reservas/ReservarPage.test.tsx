import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { abrirApp, fijarHoy, simularBackend, simularIdaAWebpay } from '@/test/utilidades'

const SERVICIO = {
  id: 1,
  nombre: 'Corte de pelo',
  descripcion: null,
  precio: 15000,
  duracion_minutos: 60,
  activo: true,
}

const RESERVA_CREADA = {
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

function backendQueFunciona() {
  return {
    'GET /api/servicios': { body: [SERVICIO] },
    'GET /api/disponibilidad': {
      body: { fecha: '2026-10-12', horas: ['10:00', '10:30'], monto_abono: 4500 },
    },
    'POST /api/reservas': { status: 201, body: RESERVA_CREADA },
    'POST /api/pagos': { status: 201, body: { url: 'https://webpay.falso', token: 'tok' } },
  }
}

/** Elige el lunes 12 a las 10:00 y llena los datos del cliente. */
async function elegirHoraYLlenarDatos(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(await screen.findByRole('button', { name: /12/ }))
  await usuario.click(await screen.findByRole('button', { name: '10:00' }))
  await usuario.type(screen.getByLabelText('Nombre y apellido'), 'Ana Pérez')
  await usuario.type(screen.getByLabelText('Email'), 'ana@correo.cl')
  await usuario.type(screen.getByLabelText('Teléfono'), '+56912345678')
}

const botonPagar = () => screen.getByRole('button', { name: /webpay/i })

describe('Página para reservar', () => {
  beforeEach(() => {
    fijarHoy(new Date(2026, 9, 11, 20, 0)) // domingo 11 de octubre de 2026, 20:00
  })

  it('no deja pagar sin elegir una hora', async () => {
    simularBackend(backendQueFunciona())
    abrirApp('/reservar/1')

    expect(await screen.findByText('Elige una hora para continuar')).toBeInTheDocument()
    expect(botonPagar()).toBeDisabled()
  })

  it('muestra el abono y lo que queda por pagar en el local', async () => {
    simularBackend(backendQueFunciona())
    abrirApp('/reservar/1')

    expect(await screen.findByText('$4.500')).toBeInTheDocument()
    expect(screen.getByText(/\$10\.500/)).toBeInTheDocument()
  })

  it('reserva y lleva al cliente a Webpay', async () => {
    const backend = simularBackend(backendQueFunciona())
    const idaAWebpay = simularIdaAWebpay()
    const usuario = userEvent.setup()
    abrirApp('/reservar/1')

    await elegirHoraYLlenarDatos(usuario)
    await usuario.click(botonPagar())

    await waitFor(() => expect(idaAWebpay).toHaveBeenCalledTimes(1))
    expect(backend.vecesLlamada('POST /api/reservas')).toBe(1)
    expect(backend.vecesLlamada('POST /api/pagos')).toBe(1)
  })

  it('doble click en pagar crea una sola reserva y un solo pago', async () => {
    const backend = simularBackend(backendQueFunciona())
    const idaAWebpay = simularIdaAWebpay()
    const usuario = userEvent.setup()
    abrirApp('/reservar/1')

    await elegirHoraYLlenarDatos(usuario)
    await usuario.dblClick(botonPagar())

    await waitFor(() => expect(idaAWebpay).toHaveBeenCalled())
    expect(backend.vecesLlamada('POST /api/reservas')).toBe(1)
    expect(backend.vecesLlamada('POST /api/pagos')).toBe(1)
    expect(idaAWebpay).toHaveBeenCalledTimes(1)
  })

  it('enviar el formulario varias veces seguidas (ej. Enter repetido) reserva una sola vez', async () => {
    const backend = simularBackend(backendQueFunciona())
    simularIdaAWebpay()
    const usuario = userEvent.setup()
    abrirApp('/reservar/1')

    await elegirHoraYLlenarDatos(usuario)
    const formulario = screen.getByLabelText('Email').closest('form')!
    fireEvent.submit(formulario)
    fireEvent.submit(formulario)
    fireEvent.submit(formulario)

    await waitFor(() => expect(backend.vecesLlamada('POST /api/pagos')).toBe(1))
    expect(backend.vecesLlamada('POST /api/reservas')).toBe(1)
  })

  it('el botón sigue bloqueado mientras el navegador se va a Webpay', async () => {
    simularBackend(backendQueFunciona())
    const idaAWebpay = simularIdaAWebpay()
    const usuario = userEvent.setup()
    abrirApp('/reservar/1')

    await elegirHoraYLlenarDatos(usuario)
    await usuario.click(botonPagar())
    await waitFor(() => expect(idaAWebpay).toHaveBeenCalled())

    // La página de Webpay tarda un poco en cargar: un click más no debe reservar de nuevo.
    expect(botonPagar()).toBeDisabled()
    expect(botonPagar()).toHaveTextContent('Redirigiendo a Webpay…')
  })

  it('si otra persona tomó la hora, avisa y actualiza las horas', async () => {
    const backend = simularBackend({
      ...backendQueFunciona(),
      'POST /api/reservas': { status: 409, body: { error: 'Esa hora ya no está disponible' } },
    })
    const usuario = userEvent.setup()
    abrirApp('/reservar/1')

    await elegirHoraYLlenarDatos(usuario)
    await usuario.click(botonPagar())

    expect(await screen.findByText(/Alguien acaba de tomar esa hora/)).toBeInTheDocument()
    expect(botonPagar()).toBeDisabled() // hay que elegir otra hora
    expect(backend.vecesLlamada('POST /api/pagos')).toBe(0)
    await waitFor(() => expect(backend.vecesLlamada('GET /api/disponibilidad')).toBeGreaterThan(1))
  })

  it('si Webpay no responde, lleva a la reserva para reintentar el pago', async () => {
    simularBackend({
      ...backendQueFunciona(),
      'POST /api/pagos': { status: 502, body: { error: 'No pudimos conectar con Webpay' } },
      'GET /api/reservas/7': { body: RESERVA_CREADA },
    })
    const usuario = userEvent.setup()
    const { router } = abrirApp('/reservar/1')

    await elegirHoraYLlenarDatos(usuario)
    await usuario.click(botonPagar())

    await waitFor(() => expect(router.state.location.pathname).toBe('/reservas/7'))
    expect(await screen.findByText('El pago no se completó')).toBeInTheDocument()
  })
})
