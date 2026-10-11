import { useQuery } from '@tanstack/react-query'
import { getServicios } from './api'

export const useServicios = () => useQuery({ queryKey: ['servicios'], queryFn: getServicios })
