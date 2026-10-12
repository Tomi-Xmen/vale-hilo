import { useState } from 'react'
import { aFechaISO, formatDiaSemana, formatMes, sumarDias } from '@/lib/fechas'

const DIAS_POR_SEMANA = 7
// El backend permite reservar hasta 60 días hacia adelante: 8 semanas cubren ese rango.
const SEMANAS_MAXIMAS = 8

type Props = {
  fechaElegida: string
  onElegir: (fecha: string) => void
}

export function SelectorDia({ fechaElegida, onElegir }: Props) {
  const [semana, setSemana] = useState(0)

  // Se calcula una sola vez al mostrar el selector, no en cada render.
  const [hoy] = useState(() => new Date())
  const primerDia = sumarDias(hoy, semana * DIAS_POR_SEMANA)
  const dias = Array.from({ length: DIAS_POR_SEMANA }, (_, i) => sumarDias(primerDia, i))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {formatMes(primerDia)} {primerDia.getFullYear()}
        </span>
        <div className="flex gap-1">
          <BotonFlecha
            etiqueta="Semana anterior"
            disabled={semana === 0}
            onClick={() => setSemana(semana - 1)}
          >
            ‹
          </BotonFlecha>
          <BotonFlecha
            etiqueta="Semana siguiente"
            disabled={semana === SEMANAS_MAXIMAS - 1}
            onClick={() => setSemana(semana + 1)}
          >
            ›
          </BotonFlecha>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {dias.map((dia) => {
          const fecha = aFechaISO(dia)
          const elegido = fecha === fechaElegida
          return (
            <button
              key={fecha}
              type="button"
              onClick={() => onElegir(fecha)}
              className={`flex flex-col items-center rounded-xl border py-2 transition ${
                elegido
                  ? 'border-tinta bg-tinta text-white'
                  : 'border-marca-100 bg-white hover:border-marca-500'
              }`}
            >
              <span className="text-xs capitalize">{formatDiaSemana(dia)}</span>
              <span className="text-lg font-semibold">{dia.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type BotonFlechaProps = {
  etiqueta: string
  disabled: boolean
  onClick: () => void
  children: string
}

function BotonFlecha({ etiqueta, disabled, onClick, children }: BotonFlechaProps) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={disabled}
      onClick={onClick}
      className="h-8 w-8 rounded-full border border-marca-100 bg-white text-lg leading-none hover:bg-gray-50 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
