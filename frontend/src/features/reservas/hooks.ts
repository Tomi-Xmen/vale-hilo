import { useQuery } from '@tanstack/react-query'
import { getAgenda, getDisponibilidad, getReserva } from './api'

export const useDisponibilidad = (servicioId: number, fecha: string) =>
  useQuery({
    queryKey: ['disponibilidad', servicioId, fecha],
    queryFn: () => getDisponibilidad(servicioId, fecha),
  })

export const useReserva = (reservaId: number) =>
  useQuery({ queryKey: ['reserva', reservaId], queryFn: () => getReserva(reservaId) })

export const claveAgenda = (fecha: string) => ['admin', 'agenda', fecha]

export const useAgenda = (fecha: string) =>
  useQuery({ queryKey: claveAgenda(fecha), queryFn: () => getAgenda(fecha) })
