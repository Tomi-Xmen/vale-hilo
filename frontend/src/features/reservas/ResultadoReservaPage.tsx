import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Boton } from '@/components/ui/Boton'
import { estilosBoton } from '@/components/ui/estilosBoton'
import { pagarReserva } from '@/features/pagos/api'
import { desdeISO, formatFechaLarga, formatHora } from '@/lib/fechas'
import { formatPrecio } from '@/lib/format'
import { useAccionSinRepetir } from '@/lib/useAccionSinRepetir'
import type { Reserva } from './api'
import { useReserva } from './hooks'

// Página a la que vuelve el cliente después de pagar (o intentar pagar) en Webpay.
export function ResultadoReservaPage() {
  const reservaId = Number(useParams().reservaId)
  const { data: reserva, isPending, isError } = useReserva(reservaId)

  if (isPending) return <p className="text-gray-500">Revisando tu reserva…</p>
  if (isError) return <p className="text-red-600">No encontramos esta reserva.</p>

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      {reserva.estado === 'confirmada' && <ReservaConfirmada reserva={reserva} />}
      {reserva.estado !== 'confirmada' && reserva.puede_pagar && (
        <PagoPendiente reserva={reserva} />
      )}
      {reserva.estado !== 'confirmada' && !reserva.puede_pagar && (
        <TiempoAgotado reserva={reserva} />
      )}
    </div>
  )
}

function ReservaConfirmada({ reserva }: { reserva: Reserva }) {
  return (
    <>
      <Encabezado icono="✓" color="bg-green-100 text-green-700" titulo="¡Reserva confirmada!" />
      <DetalleReserva reserva={reserva} />
      <p className="mt-4 text-sm text-gray-600">
        Pagaste un abono de {formatPrecio(reserva.monto_abono)}. El resto se paga en el local.
      </p>
      <Link to="/" className={`${estilosBoton('secundario')} mt-6 w-full`}>
        Volver al inicio
      </Link>
    </>
  )
}

function PagoPendiente({ reserva }: { reserva: Reserva }) {
  const reintentar = useAccionSinRepetir<void>(() => pagarReserva(reserva.id))
  const guardadaHasta = reserva.expira_en ? formatHora(desdeISO(reserva.expira_en)) : null

  return (
    <>
      <Encabezado icono="!" color="bg-amber-100 text-amber-700" titulo="El pago no se completó" />
      <DetalleReserva reserva={reserva} />
      <p className="mt-4 text-sm text-gray-600">
        Guardamos tu hora {guardadaHasta && `hasta las ${guardadaHasta}`}. Puedes intentar de nuevo,
        incluso con otra tarjeta.
      </p>
      {reintentar.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {reintentar.error.message}
        </p>
      )}
      <Boton
        className="mt-6 w-full"
        disabled={reintentar.bloqueada}
        onClick={() => reintentar.ejecutar()}
      >
        {reintentar.bloqueada
          ? 'Redirigiendo a Webpay…'
          : `Pagar abono de ${formatPrecio(reserva.monto_abono)}`}
      </Boton>
    </>
  )
}

function TiempoAgotado({ reserva }: { reserva: Reserva }) {
  return (
    <>
      <Encabezado
        icono="×"
        color="bg-gray-100 text-gray-600"
        titulo="Se acabó el tiempo para pagar"
      />
      <p className="text-sm text-gray-600">
        La hora que habías elegido quedó libre nuevamente. Si quieres, puedes reservar otra.
      </p>
      <Link to={`/reservar/${reserva.servicio_id}`} className={`${estilosBoton()} mt-6 w-full`}>
        Elegir otra hora
      </Link>
    </>
  )
}

function Encabezado({ icono, color, titulo }: { icono: string; color: string; titulo: string }) {
  return (
    <div className="mb-5 flex flex-col items-center text-center">
      <span
        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${color}`}
      >
        {icono}
      </span>
      <h1 className="text-2xl font-semibold">{titulo}</h1>
    </div>
  )
}

function DetalleReserva({ reserva }: { reserva: Reserva }) {
  const inicio = desdeISO(reserva.inicio)
  return (
    <dl className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
      <Fila nombre="Servicio">{reserva.servicio_nombre}</Fila>
      <Fila nombre="Día">
        <span className="first-letter:uppercase">{formatFechaLarga(inicio)}</span>
      </Fila>
      <Fila nombre="Hora">{formatHora(inicio)}</Fila>
    </dl>
  )
}

function Fila({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{nombre}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
