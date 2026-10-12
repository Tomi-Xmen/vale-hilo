import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'
import { rutas } from '@/app/rutas'

type Respuesta = { status?: number; body: unknown }

/**
 * Reemplaza `fetch` por un backend falso. Cada ruta se escribe como "MÉTODO /api/ruta"
 * (sin los parámetros después del ?) y responde lo que se indique.
 */
export function simularBackend(respuestas: Record<string, Respuesta>) {
  const llamadas: string[] = []

  vi.stubGlobal('fetch', async (url: string, opciones: RequestInit = {}) => {
    const ruta = `${opciones.method ?? 'GET'} ${url.split('?')[0]}`
    llamadas.push(ruta)

    const respuesta = respuestas[ruta]
    if (!respuesta) throw new Error(`El test no simuló la ruta: ${ruta}`)
    return new Response(JSON.stringify(respuesta.body), {
      status: respuesta.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  return {
    /** Cuántas veces el frontend llamó a esa ruta. */
    vecesLlamada: (ruta: string) => llamadas.filter((llamada) => llamada === ruta).length,
  }
}

/**
 * Evita que el test salga a Webpay de verdad: anota cada vez que el frontend intenta
 * enviar al cliente a pagar.
 */
export function simularIdaAWebpay() {
  return vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
}

/** Fija "hoy" para que los tests no dependan del día en que se corren. */
export function fijarHoy(fecha: Date) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(fecha)
}

/** Muestra la app completa en una ruta, como si el cliente hubiera abierto esa dirección. */
export function abrirApp(ruta: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router }
}
