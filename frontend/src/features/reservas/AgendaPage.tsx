import { useState } from 'react'
import { aFechaISO, desdeISO, formatFechaLarga, sumarDias } from '@/lib/fechas'
import { formatPrecio } from '@/lib/format'
import { useAgenda } from './hooks'
import { ReservaEnAgenda } from './ReservaEnAgenda'

// Panel: las reservas de un día, para que la dueña sepa a quién atiende.
export function AgendaPage() {
  const [fecha, setFecha] = useState(() => aFechaISO(new Date()))
  const agenda = useAgenda(fecha)

  const moverDias = (dias: number) => setFecha(aFechaISO(sumarDias(desdeISO(fecha), dias)))
  const confirmadas = agenda.data?.filter((reserva) => reserva.estado === 'confirmada') ?? []
  const totalAbonos = confirmadas.reduce((suma, reserva) => suma + reserva.monto_abono, 0)

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold first-letter:uppercase">
          {formatFechaLarga(desdeISO(fecha))}
        </h1>
        <BotonFecha onClick={() => moverDias(-1)} etiqueta="Día anterior">
          ‹
        </BotonFecha>
        <BotonFecha onClick={() => setFecha(aFechaISO(new Date()))}>Hoy</BotonFecha>
        <BotonFecha onClick={() => moverDias(1)} etiqueta="Día siguiente">
          ›
        </BotonFecha>
        <input
          type="date"
          aria-label="Ir a una fecha"
          value={fecha}
          onChange={(evento) => evento.target.value && setFecha(evento.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
        />
      </div>

      {agenda.isPending && <p className="text-gray-500">Cargando reservas…</p>}
      {agenda.isError && <p className="text-red-600">No pudimos cargar la agenda.</p>}

      {agenda.data && (
        <>
          <p className="mb-4 text-sm text-gray-600">
            {confirmadas.length === 1
              ? '1 reserva confirmada'
              : `${confirmadas.length} reservas confirmadas`}
            {confirmadas.length > 0 && ` · ${formatPrecio(totalAbonos)} en abonos`}
          </p>

          {agenda.data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No hay reservas este día.
            </p>
          ) : (
            <ul className="space-y-3">
              {agenda.data.map((reserva) => (
                <li key={reserva.id}>
                  <ReservaEnAgenda reserva={reserva} fecha={fecha} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

type BotonFechaProps = { onClick: () => void; etiqueta?: string; children: string }

function BotonFecha({ onClick, etiqueta, children }: BotonFechaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
    >
      {children}
    </button>
  )
}
