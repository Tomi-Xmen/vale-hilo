// Las fechas viajan al backend como texto "2026-10-12" y las horas como "10:00",
// siempre en hora de Chile. Estas funciones evitan los cambios de zona horaria de `Date`.

/** "2026-10-12" a partir de una fecha, usando el día local (no UTC). */
export function aFechaISO(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function sumarDias(fecha: Date, dias: number) {
  const resultado = new Date(fecha)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

/** Convierte "2026-10-12" o "2026-10-12T10:00:00" en Date, en hora local. */
export function desdeISO(texto: string) {
  return texto.length === 10 ? new Date(`${texto}T00:00:00`) : new Date(texto)
}

const diaSemanaCorto = new Intl.DateTimeFormat('es-CL', { weekday: 'short' })
const fechaLarga = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const mesCorto = new Intl.DateTimeFormat('es-CL', { month: 'short' })
// hourCycle 'h23': reloj de 24 horas ("20:10"); sin esto, es-CL muestra "08:10 p. m.".
const hora = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "lun." */
export const formatDiaSemana = (fecha: Date) => diaSemanaCorto.format(fecha)

/** "oct." */
export const formatMes = (fecha: Date) => mesCorto.format(fecha)

/** "lunes, 12 de octubre" */
export const formatFechaLarga = (fecha: Date) => fechaLarga.format(fecha)

/** "10:00" */
export const formatHora = (fecha: Date) => hora.format(fecha)
