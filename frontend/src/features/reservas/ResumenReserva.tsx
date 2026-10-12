import { Boton } from '@/components/ui/Boton'
import { desdeISO, formatFechaLarga } from '@/lib/fechas'
import { formatDuracion, formatPrecio } from '@/lib/format'
import type { Servicio } from '@/features/servicios/api'

type Props = {
  servicio: Servicio
  fecha: string
  hora: string | null
  montoAbono: number | undefined
  idFormulario: string
  enviando: boolean
  error: string | null
}

export function ResumenReserva({
  servicio,
  fecha,
  hora,
  montoAbono,
  idFormulario,
  enviando,
  error,
}: Props) {
  const falta = hora === null ? 'Elige una hora para continuar' : null

  return (
    <aside className="rounded-2xl border border-marca-100 bg-white p-6 shadow-sm shadow-marca-100">
      <h2 className="mb-4 font-display text-2xl font-semibold">Resumen</h2>

      <dl className="space-y-2 text-sm">
        <Fila nombre="Servicio" valor={servicio.nombre} />
        <Fila nombre="Duración" valor={formatDuracion(servicio.duracion_minutos)} />
        <Fila nombre="Día" valor={formatFechaLarga(desdeISO(fecha))} />
        <Fila nombre="Hora" valor={hora ?? '—'} />
        <Fila nombre="Precio total" valor={formatPrecio(servicio.precio)} />
      </dl>

      {montoAbono !== undefined && (
        <div className="mt-5 rounded-xl bg-marca-50 p-4 text-sm">
          <div className="flex justify-between font-semibold text-marca-700">
            <span>Abono a pagar ahora</span>
            <span>{formatPrecio(montoAbono)}</span>
          </div>
          <p className="mt-1 text-gray-600">
            El resto ({formatPrecio(servicio.precio - montoAbono)}) se paga el día de tu cita.
          </p>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Boton
        type="submit"
        form={idFormulario}
        disabled={hora === null || enviando}
        className="mt-5 w-full"
      >
        {enviando ? 'Redirigiendo a Webpay…' : 'Pagar abono con Webpay'}
      </Boton>
      {falta && <p className="mt-2 text-center text-xs text-gray-500">{falta}</p>}
    </aside>
  )
}

function Fila({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{nombre}</dt>
      <dd className="text-right font-medium first-letter:uppercase">{valor}</dd>
    </div>
  )
}
