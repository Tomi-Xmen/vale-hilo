export type Variante = 'principal' | 'secundario'

const estilosPorVariante: Record<Variante, string> = {
  principal: 'bg-marca-600 text-white hover:bg-marca-700 disabled:bg-gray-300',
  secundario: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
}

/** Clases de un botón. Sirve también para que un <Link> se vea como botón. */
export function estilosBoton(variante: Variante = 'principal') {
  return `inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-medium transition disabled:cursor-not-allowed ${estilosPorVariante[variante]}`
}
