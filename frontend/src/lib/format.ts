const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

export const formatPrecio = (monto: number) => pesos.format(monto)

export function formatDuracion(minutos: number) {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}
