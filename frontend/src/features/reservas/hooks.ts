import { useQuery } from '@tanstack/react-query'
import { getDisponibilidad, getReserva } from './api'

export const useDisponibilidad = (servicioId: number, fecha: string) =>
  useQuery({
    queryKey: ['disponibilidad', servicioId, fecha],
    queryFn: () => getDisponibilidad(servicioId, fecha),
  })

export const useReserva = (reservaId: number) =>
  useQuery({ queryKey: ['reserva', reservaId], queryFn: () => getReserva(reservaId) })
