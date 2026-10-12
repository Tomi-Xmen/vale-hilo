import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Boton } from '@/components/ui/Boton'
import { desdeISO, formatHora } from '@/lib/fechas'
import { formatPrecio } from '@/lib/format'
import { enlaceWhatsApp } from '@/lib/telefono'
import { useAccionSinRepetir } from '@/lib/useAccionSinRepetir'
import { cancelarReserva, type EstadoReserva, type ReservaAgenda } from './api'
import { claveAgenda } from './hooks'

const ETIQUETA_ESTADO: Record<EstadoReserva, { texto: string; color: string }> = {
  confirmada: { texto: 'Confirmada', color: 'bg-green-100 text-green-800' },
  pendiente_pago: { texto: 'Pagando ahora', color: 'bg-amber-100 text-amber-800' },
  cancelada: { texto: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
}

type Props = { reserva: ReservaAgenda; fecha: string }

export function ReservaEnAgenda({ reserva, fecha }: Props) {
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false)
  const cancelada = reserva.estado === 'cancelada'
  const estado = ETIQUETA_ESTADO[reserva.estado]

  return (
    <article
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${cancelada ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <p className="w-28 shrink-0 text-lg font-semibold">
          {formatHora(desdeISO(reserva.inicio))}
          <span className="text-sm font-normal text-gray-500">
            {' '}
            – {formatHora(desdeISO(reserva.fin))}
          </span>
        </p>

        <div className="min-w-0 flex-1">
          <p className={`font-medium ${cancelada ? 'line-through' : ''}`}>
            {reserva.servicio_nombre} · {reserva.cliente_nombre}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`tel:${reserva.cliente_telefono}`} className="text-marca-700 hover:underline">
              {reserva.cliente_telefono}
            </a>
            <a
              href={enlaceWhatsApp(reserva.cliente_telefono)}
              target="_blank"
              rel="noreferrer"
              className="text-marca-700 hover:underline"
            >
              WhatsApp
            </a>
            <a href={`mailto:${reserva.cliente_email}`} className="text-marca-700 hover:underline">
              {reserva.cliente_email}
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.color}`}>
            {estado.texto}
          </span>
          {!cancelada && !confirmandoCancelacion && (
            <button
              onClick={() => setConfirmandoCancelacion(true)}
              className="text-sm font-medium text-red-700 hover:underline"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {!cancelada && confirmandoCancelacion && (
        <ConfirmarCancelacion
          reserva={reserva}
          fecha={fecha}
          onVolver={() => setConfirmandoCancelacion(false)}
        />
      )}
    </article>
  )
}

type ConfirmarProps = { reserva: ReservaAgenda; fecha: string; onVolver: () => void }

function ConfirmarCancelacion({ reserva, fecha, onVolver }: ConfirmarProps) {
  const queryClient = useQueryClient()
  // Solo una reserva confirmada tiene un abono pagado que se pueda devolver.
  const tieneAbonoPagado = reserva.estado === 'confirmada'
  const [devolverAbono, setDevolverAbono] = useState(tieneAbonoPagado)

  const cancelar = useAccionSinRepetir<void>(async () => {
    await cancelarReserva(reserva.id, devolverAbono)
    await queryClient.invalidateQueries({ queryKey: claveAgenda(fecha) })
  })

  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-900">
        ¿Cancelar la reserva de {reserva.cliente_nombre} a las{' '}
        {formatHora(desdeISO(reserva.inicio))}?
      </p>
      <p className="mt-1 text-sm text-red-800">La hora quedará libre para otros clientes.</p>

      {tieneAbonoPagado && (
        <label className="mt-3 flex items-center gap-2 text-sm text-red-900">
          <input
            type="checkbox"
            checked={devolverAbono}
            onChange={(evento) => setDevolverAbono(evento.target.checked)}
          />
          Devolver el abono ({formatPrecio(reserva.monto_abono)}) a la tarjeta del cliente
        </label>
      )}

      {cancelar.error && <p className="mt-3 text-sm text-red-700">{cancelar.error.message}</p>}

      <div className="mt-4 flex gap-2">
        <Boton variante="peligro" onClick={() => cancelar.ejecutar()} disabled={cancelar.bloqueada}>
          {cancelar.bloqueada ? 'Cancelando…' : 'Sí, cancelar'}
        </Boton>
        <Boton variante="secundario" onClick={onVolver} disabled={cancelar.bloqueada}>
          No, volver
        </Boton>
      </div>
    </div>
  )
}
