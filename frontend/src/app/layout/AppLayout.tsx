import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="mb-6 text-2xl font-semibold">Agenda</h1>
        <Outlet />
      </main>
    </div>
  )
}
