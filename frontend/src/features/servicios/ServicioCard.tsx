import { Link } from 'react-router-dom'
import { formatDuracion, formatPrecio } from '@/lib/format'
import type { Servicio } from './api'

export function ServicioCard({ servicio }: { servicio: Servicio }) {
  return (
    <Link
      to={`/reservar/${servicio.id}`}
      className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-marca-500 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold">{servicio.nombre}</h3>
      {servicio.descripcion && <p className="mt-1 text-sm text-gray-600">{servicio.descripcion}</p>}

      <div className="mt-auto flex items-end justify-between gap-4 pt-4">
        <div>
          <p className="text-lg font-semibold">{formatPrecio(servicio.precio)}</p>
          <p className="text-sm text-gray-500">{formatDuracion(servicio.duracion_minutos)}</p>
        </div>
        <span className="font-medium text-marca-600 group-hover:underline">Reservar →</span>
      </div>
    </Link>
  )
}
