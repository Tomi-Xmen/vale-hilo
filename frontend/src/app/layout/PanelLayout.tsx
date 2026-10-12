import { useQueryClient } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { CLAVE_SESION, cerrarSesion } from '@/features/auth/api'
import { useSesion } from '@/features/auth/hooks'

// Envuelve todas las páginas del panel: solo se muestran si la dueña inició sesión.
export function PanelLayout() {
  const sesion = useSesion()
  const queryClient = useQueryClient()

  async function salir() {
    await cerrarSesion()
    queryClient.clear() // borra los datos del panel que quedaron en memoria
    queryClient.setQueryData(CLAVE_SESION, null)
  }

  if (sesion.isPending) return <p className="p-8 text-gray-500">Cargando…</p>
  if (!sesion.data) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold text-marca-700">Panel</span>
          <nav className="flex gap-1 text-sm font-medium">
            <EnlaceMenu a="/admin">Agenda</EnlaceMenu>
            <EnlaceMenu a="/admin/servicios">Servicios</EnlaceMenu>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-gray-500 sm:inline">{sesion.data.email}</span>
            <button onClick={salir} className="font-medium text-gray-700 hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function EnlaceMenu({ a, children }: { a: string; children: string }) {
  return (
    <NavLink
      to={a}
      end
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 ${isActive ? 'bg-marca-50 text-marca-700' : 'text-gray-600 hover:bg-gray-100'}`
      }
    >
      {children}
    </NavLink>
  )
}
