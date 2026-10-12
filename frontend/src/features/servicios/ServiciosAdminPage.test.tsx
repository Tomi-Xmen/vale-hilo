import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { abrirApp, simularBackend } from '@/test/utilidades'

const CORTE = {
  id: 1,
  nombre: 'Corte de pelo',
  descripcion: null,
  precio: 15000,
  duracion_minutos: 60,
  activo: true,
}

function backendDeServicios() {
  return simularBackend({
    'GET /api/auth/sesion': { body: { email: 'duena@negocio.cl' } },
    'GET /api/admin/servicios': { body: [CORTE] },
    'GET /api/servicios': { body: [CORTE] },
    'POST /api/admin/servicios': { status: 201, body: { ...CORTE, id: 2 } },
    'PUT /api/admin/servicios/1': { body: CORTE },
  })
}

describe('Servicios del panel', () => {
  it('crea un servicio nuevo', async () => {
    const backend = backendDeServicios()
    const usuario = userEvent.setup()
    abrirApp('/admin/servicios')

    await usuario.click(await screen.findByRole('button', { name: 'Nuevo servicio' }))
    await usuario.type(screen.getByLabelText('Nombre'), 'Manicure')
    await usuario.type(screen.getByLabelText('Precio (pesos)'), '12000')
    await usuario.clear(screen.getByLabelText('Duración (minutos)'))
    await usuario.type(screen.getByLabelText('Duración (minutos)'), '45')
    await usuario.dblClick(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(backend.datosEnviados('POST /api/admin/servicios')).toEqual([
        {
          nombre: 'Manicure',
          descripcion: null,
          precio: 12000,
          duracion_minutos: 45,
          activo: true,
        },
      ]),
    )
    // Al guardar se cierra el formulario.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull())
  })

  it('edita el precio de un servicio', async () => {
    const backend = backendDeServicios()
    const usuario = userEvent.setup()
    abrirApp('/admin/servicios')

    await usuario.click(await screen.findByRole('button', { name: 'Editar' }))
    const precio = screen.getByLabelText('Precio (pesos)')
    await usuario.clear(precio)
    await usuario.type(precio, '18000')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(backend.datosEnviados('PUT /api/admin/servicios/1')).toEqual([
        {
          nombre: 'Corte de pelo',
          descripcion: null,
          precio: 18000,
          duracion_minutos: 60,
          activo: true,
        },
      ]),
    )
  })
})
