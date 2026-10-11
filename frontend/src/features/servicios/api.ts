import { get } from '@/lib/http'

export type Servicio = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_minutos: number
  activo: boolean
}

export const getServicios = () => get<Servicio[]>('/servicios')
