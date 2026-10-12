import { Link } from 'react-router-dom'
import { formatDuracion, formatPrecio } from '@/lib/format'
import type { Servicio } from './api'

export function ServicioCard({ servicio }: { servicio: Servicio }) {
  return (
    <Link
      to={`/reservar/${servicio.id}`}
      className="group flex h-full flex-col rounded-2xl border border-marca-100 bg-white p-6 transition hover:border-marca-200 hover:shadow-lg hover:shadow-marca-100"
    >
      <h3 className="font-display text-2xl font-semibold first-letter:uppercase">
        {servicio.nombre}
      </h3>
      {servicio.descripcion && (
        <p className="mt-2 text-sm text-gray-600 first-letter:uppercase">{servicio.descripcion}</p>
      )}

      {/* mt-auto + pt-6: el precio queda siempre abajo, aunque las descripciones midan distinto. */}
      <div className="mt-auto pt-6">
        <div className="flex items-end justify-between gap-4 border-t border-marca-100 pt-4">
          <div>
            <p className="text-lg font-semibold">{formatPrecio(servicio.precio)}</p>
            <p className="text-sm text-gray-500">{formatDuracion(servicio.duracion_minutos)}</p>
          </div>
          <span className="rounded-full bg-tinta px-4 py-2 text-sm font-medium text-white transition group-hover:bg-tinta-suave">
            Reservar
          </span>
        </div>
      </div>
    </Link>
  )
}
