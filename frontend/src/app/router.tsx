import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { rutas } from '@/app/rutas'

const router = createBrowserRouter(rutas)

export function AppRouter() {
  return <RouterProvider router={router} />
}
