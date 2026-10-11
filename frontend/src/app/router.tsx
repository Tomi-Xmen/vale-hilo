import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HealthStatus } from '@/features/health/HealthStatus'
import { ServiciosPage } from '@/features/servicios/ServiciosPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ServiciosPage /> },
      { path: 'estado', element: <HealthStatus /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
