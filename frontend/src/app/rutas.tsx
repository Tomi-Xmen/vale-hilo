import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { PanelLayout } from '@/app/layout/PanelLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { HealthStatus } from '@/features/health/HealthStatus'
import { AgendaPage } from '@/features/reservas/AgendaPage'
import { ReservarPage } from '@/features/reservas/ReservarPage'
import { ResultadoReservaPage } from '@/features/reservas/ResultadoReservaPage'
import { ServiciosAdminPage } from '@/features/servicios/ServiciosAdminPage'
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
  // Panel del negocio: solo para la dueña, con sesión iniciada.
  { path: '/admin/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: <PanelLayout />,
    children: [
      { index: true, element: <AgendaPage /> },
      { path: 'servicios', element: <ServiciosAdminPage /> },
    ],
  },
]
