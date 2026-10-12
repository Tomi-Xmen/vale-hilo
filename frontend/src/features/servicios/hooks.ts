import { useQuery } from '@tanstack/react-query'
import { getServicios, getServiciosAdmin } from './api'

export const useServicios = () => useQuery({ queryKey: ['servicios'], queryFn: getServicios })

export const CLAVE_SERVICIOS_ADMIN = ['admin', 'servicios']

export const useServiciosAdmin = () =>
  useQuery({ queryKey: CLAVE_SERVICIOS_ADMIN, queryFn: getServiciosAdmin })
