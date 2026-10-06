import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HealthStatus } from '@/features/health/HealthStatus'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <main className="mx-auto max-w-md p-8">
        <h1 className="mb-4 text-2xl font-semibold">Agenda</h1>
        <HealthStatus />
      </main>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
