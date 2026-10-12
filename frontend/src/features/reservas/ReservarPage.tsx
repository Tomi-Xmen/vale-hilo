import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { pagarReserva } from '@/features/pagos/api'
import { useServicios } from '@/features/servicios/hooks'
import { aFechaISO } from '@/lib/fechas'
import { HttpError } from '@/lib/http'
import { useAccionSinRepetir } from '@/lib/useAccionSinRepetir'
import { crearReserva, type DatosCliente } from './api'
import { FormularioCliente } from './FormularioCliente'
import { useDisponibilidad } from './hooks'
import { ResumenReserva } from './ResumenReserva'
import { SelectorDia } from './SelectorDia'
import { SelectorHora } from './SelectorHora'

const ID_FORMULARIO = 'datos-cliente'

export function ReservarPage() {
  const servicioId = Number(useParams().servicioId)
  const navigate = useNavigate()
  const servicios = useServicios()
  const servicio = servicios.data?.find((s) => s.id === servicioId)

  const [fecha, setFecha] = useState(() => aFechaISO(new Date()))
  const [hora, setHora] = useState<string | null>(null)
  const disponibilidad = useDisponibilidad(servicioId, fecha)

  const reservarYPagar = useAccionSinRepetir(
    async (cliente: DatosCliente) => {
      if (hora === null) return
      const reserva = await crearReserva({
        servicio_id: servicioId,
        inicio: `${fecha}T${hora}:00`,
        ...cliente,
      })
      try {
        await pagarReserva(reserva.id)
      } catch {
        // La hora ya quedó guardada: en la página de la reserva puede reintentar el pago.
        navigate(`/reservas/${reserva.id}`)
      }
    },
    {
      onError: (error) => {
        // Otra persona tomó la hora mientras el cliente llenaba sus datos.
        if (error instanceof HttpError && error.status === 409) {
          setHora(null)
          disponibilidad.refetch()
        }
      },
    },
  )

  function elegirFecha(nuevaFecha: string) {
    setFecha(nuevaFecha)
    setHora(null)
  }

  if (servicios.isPending) return <p className="text-gray-500">Cargando…</p>
  if (!servicio) {
    return (
      <div>
        <p className="mb-4 text-gray-600">Este servicio no existe o ya no está disponible.</p>
        <Link to="/" className="font-medium text-marca-700 hover:underline">
          ← Ver servicios
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="text-sm font-medium text-marca-700 hover:underline">
        ← Servicios
      </Link>
      <h1 className="mt-2 mb-8 font-display text-4xl font-semibold first-letter:uppercase sm:text-5xl">
        Reservar {servicio.nombre}
      </h1>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <Paso numero={1} titulo="Elige el día">
            <SelectorDia fechaElegida={fecha} onElegir={elegirFecha} />
          </Paso>

          <Paso numero={2} titulo="Elige la hora">
            <SelectorHora
              horas={disponibilidad.data?.horas}
              cargando={disponibilidad.isPending}
              horaElegida={hora}
              onElegir={setHora}
            />
          </Paso>

          <Paso numero={3} titulo="Tus datos">
            <FormularioCliente id={ID_FORMULARIO} onEnviar={reservarYPagar.ejecutar} />
          </Paso>
        </div>

        <div className="lg:sticky lg:top-6">
          <ResumenReserva
            servicio={servicio}
            fecha={fecha}
            hora={hora}
            montoAbono={disponibilidad.data?.monto_abono}
            idFormulario={ID_FORMULARIO}
            enviando={reservarYPagar.bloqueada}
            error={reservarYPagar.error ? mensajeDeError(reservarYPagar.error) : null}
          />
        </div>
      </div>
    </div>
  )
}

function mensajeDeError(error: Error) {
  if (error instanceof HttpError && error.status === 409) {
    return 'Alguien acaba de tomar esa hora. Elige otra, por favor.'
  }
  if (error instanceof HttpError && error.status === 400) {
    return 'Revisa que tus datos estén bien escritos.'
  }
  return 'Algo salió mal. Intenta de nuevo en unos minutos.'
}

function Paso({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marca-100 text-sm text-marca-700">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
