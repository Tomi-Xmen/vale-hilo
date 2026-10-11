import { formatDuracion, formatPrecio } from '@/lib/format'
import type { Servicio } from './api'

export function ServicioCard({ servicio }: { servicio: Servicio }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium">{servicio.nombre}</h3>
        <span className="shrink-0 font-semibold">{formatPrecio(servicio.precio)}</span>
      </div>
      {servicio.descripcion && <p className="mt-1 text-sm text-gray-600">{servicio.descripcion}</p>}
      <p className="mt-2 text-sm text-gray-500">{formatDuracion(servicio.duracion_minutos)}</p>
    </article>
  )
}
