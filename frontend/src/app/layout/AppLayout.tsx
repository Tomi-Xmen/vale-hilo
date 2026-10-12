import { Link, Outlet } from 'react-router-dom'
import { MARCA } from '@/app/marca'
import { Logotipo } from './Logotipo'
import { RedesSociales } from './RedesSociales'

// Marco de las páginas que ven los clientes: encabezado, contenido y pie.
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fffbfc] text-tinta">
      <header className="sticky top-0 z-10 border-b border-marca-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label={`${MARCA.nombre}, inicio`}>
            <Logotipo />
          </Link>
          <RedesSociales />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-marca-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <Logotipo className="text-xl" />
            <p className="text-sm text-gray-500">
              {MARCA.rubro} · {MARCA.especialidades.join(' · ')}
            </p>
          </div>
          <RedesSociales />
        </div>
      </footer>
    </div>
  )
}
