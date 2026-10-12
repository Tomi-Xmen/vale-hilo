type Props = {
  horas: string[] | undefined
  cargando: boolean
  horaElegida: string | null
  onElegir: (hora: string) => void
}

export function SelectorHora({ horas, cargando, horaElegida, onElegir }: Props) {
  if (cargando) return <p className="text-sm text-gray-500">Buscando horas disponibles…</p>

  if (!horas || horas.length === 0) {
    return (
      <p className="rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
        No hay horas disponibles este día. Prueba con otro.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {horas.map((hora) => {
        const elegida = hora === horaElegida
        return (
          <button
            key={hora}
            type="button"
            onClick={() => onElegir(hora)}
            className={`rounded-lg border py-2 text-sm font-medium transition ${
              elegida
                ? 'border-marca-600 bg-marca-600 text-white'
                : 'border-gray-200 bg-white hover:border-marca-500'
            }`}
          >
            {hora}
          </button>
        )
      })}
    </div>
  )
}
