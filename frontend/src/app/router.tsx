import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HealthStatus } from '@/features/health/HealthStatus'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [{ index: true, element: <HealthStatus /> }],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
