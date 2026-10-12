import { useQuery } from '@tanstack/react-query'
import { CLAVE_SESION, getSesion } from './api'

export const useSesion = () => useQuery({ queryKey: CLAVE_SESION, queryFn: getSesion })
