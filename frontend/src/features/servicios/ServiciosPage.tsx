import { useSearchParams } from 'react-router-dom'
import { ServicioCard } from './ServicioCard'
import { useServicios } from './hooks'

export function ServiciosPage() {
  const { data, isPending, isError } = useServicios()
  // El backend manda acá con ?pago=error si no pudo identificar el pago al volver de Webpay.
  const [parametros] = useSearchParams()
  const huboErrorDePago = parametros.get('pago') === 'error'

  return (
    <section>
      <h1 className="text-2xl font-semibold sm:text-3xl">Reserva tu hora</h1>
      <p className="mt-1 mb-6 text-gray-600">
        Elige un servicio para ver los horarios disponibles.
      </p>

      {huboErrorDePago && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          No pudimos procesar tu pago. Si se te cobró, contáctanos y lo revisamos.
        </p>
      )}

      {isPending && <p className="text-gray-500">Cargando servicios…</p>}
      {isError && <p className="text-red-600">No pudimos cargar los servicios.</p>}
      {data?.length === 0 && <p className="text-gray-500">No hay servicios disponibles.</p>}

      {data && data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((servicio) => (
            <li key={servicio.id}>
              <ServicioCard servicio={servicio} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
