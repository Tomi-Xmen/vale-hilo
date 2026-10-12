export type Variante = 'principal' | 'secundario' | 'peligro'

const estilosPorVariante: Record<Variante, string> = {
  principal: 'bg-tinta text-white hover:bg-tinta-suave disabled:bg-gray-300',
  secundario: 'border border-gray-300 bg-white text-tinta hover:bg-gray-50',
  peligro: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-gray-300',
}

/** Clases de un botón. Sirve también para que un <Link> se vea como botón. */
export function estilosBoton(variante: Variante = 'principal') {
  return `inline-flex items-center justify-center rounded-full px-5 py-2.5 font-medium transition disabled:cursor-not-allowed ${estilosPorVariante[variante]}`
}
