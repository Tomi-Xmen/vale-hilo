import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-2xl font-semibold">Agenda</h1>
      <Outlet />
    </main>
  )
}
