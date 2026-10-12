import { get, post } from '@/lib/http'

export type Disponibilidad = {
  fecha: string // "2026-10-12"
  horas: string[] // ["10:00", "10:30", ...]
  monto_abono: number
}

export type DatosCliente = {
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
}

export type ReservaNueva = DatosCliente & {
  servicio_id: number
  inicio: string // "2026-10-12T10:00:00", hora de Chile
}

export type EstadoReserva = 'pendiente_pago' | 'confirmada' | 'cancelada'

export type Reserva = {
  id: number
  servicio_id: number
  servicio_nombre: string
  inicio: string
  fin: string
  estado: EstadoReserva
  monto_abono: number
  expira_en: string | null
  puede_pagar: boolean
}

export const getDisponibilidad = (servicioId: number, fecha: string) =>
  get<Disponibilidad>(`/disponibilidad?servicio_id=${servicioId}&fecha=${fecha}`)

export const crearReserva = (datos: ReservaNueva) => post<Reserva>('/reservas', datos)

export const getReserva = (reservaId: number) => get<Reserva>(`/reservas/${reservaId}`)

// --- Panel del negocio -------------------------------------------------------

/** Una reserva vista desde el panel: incluye el contacto del cliente. */
export type ReservaAgenda = {
  id: number
  servicio_nombre: string
  inicio: string
  fin: string
  estado: EstadoReserva
  monto_abono: number
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
}

export const getAgenda = (fecha: string) => get<ReservaAgenda[]>(`/admin/reservas?fecha=${fecha}`)

export const cancelarReserva = (reservaId: number, devolverAbono: boolean) =>
  post<ReservaAgenda>(`/admin/reservas/${reservaId}/cancelar`, { devolver_abono: devolverAbono })
