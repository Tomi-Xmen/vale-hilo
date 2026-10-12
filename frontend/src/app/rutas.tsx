import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HealthStatus } from '@/features/health/HealthStatus'
import { ReservarPage } from '@/features/reservas/ReservarPage'
import { ResultadoReservaPage } from '@/features/reservas/ResultadoReservaPage'
import { ServiciosPage } from '@/features/servicios/ServiciosPage'

// Las rutas viven aparte del router para que los tests usen exactamente las mismas.
export const rutas: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ServiciosPage /> },
      { path: 'reservar/:servicioId', element: <ReservarPage /> },
      // Webpay devuelve al cliente acá (a través del backend) después de pagar.
      { path: 'reservas/:reservaId', element: <ResultadoReservaPage /> },
      { path: 'estado', element: <HealthStatus /> },
    ],
  },
]
