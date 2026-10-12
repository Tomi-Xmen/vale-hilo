import { useSearchParams } from 'react-router-dom'
import { MARCA } from '@/app/marca'
import { ServicioCard } from './ServicioCard'
import { useServicios } from './hooks'

export function ServiciosPage() {
  const { data, isPending, isError } = useServicios()
  // El backend manda acá con ?pago=error si no pudo identificar el pago al volver de Webpay.
  const [parametros] = useSearchParams()
  const huboErrorDePago = parametros.get('pago') === 'error'

  return (
    <>
      <section className="mb-12 rounded-3xl bg-gradient-to-br from-marca-100 via-marca-50 to-white px-6 py-12 text-center sm:py-16">
        <p className="text-xs font-medium tracking-[0.3em] text-marca-700 uppercase">
          {MARCA.rubro}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-6xl">Reserva tu hora</h1>
        <p className="mx-auto mt-4 max-w-md text-gray-600">
          {MARCA.especialidades.join(' · ')}. Elige tu servicio, el día y la hora que te acomoden.
        </p>
      </section>

      {huboErrorDePago && (
        <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          No pudimos procesar tu pago. Si se te cobró, contáctanos y lo revisamos.
        </p>
      )}

      <section>
        <h2 className="mb-5 font-display text-3xl font-semibold">Servicios</h2>

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
    </>
  )
}
