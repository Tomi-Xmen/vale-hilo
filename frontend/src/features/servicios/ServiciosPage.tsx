import { ServicioCard } from './ServicioCard'
import { useServicios } from './hooks'

export function ServiciosPage() {
  const { data, isPending, isError } = useServicios()

  if (isPending) return <p className="text-gray-500">Cargando servicios…</p>
  if (isError) return <p className="text-red-600">No pudimos cargar los servicios.</p>
  if (data.length === 0) return <p className="text-gray-500">No hay servicios disponibles.</p>

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Elige un servicio</h2>
      <ul className="space-y-3">
        {data.map((servicio) => (
          <li key={servicio.id}>
            <ServicioCard servicio={servicio} />
          </li>
        ))}
      </ul>
    </section>
  )
}
