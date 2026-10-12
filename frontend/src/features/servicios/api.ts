import { get, post, put } from '@/lib/http'

export type Servicio = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_minutos: number
  activo: boolean
}

export const getServicios = () => get<Servicio[]>('/servicios')

// --- Panel del negocio -------------------------------------------------------

export type DatosServicio = Omit<Servicio, 'id'>

export const getServiciosAdmin = () => get<Servicio[]>('/admin/servicios')

export const crearServicio = (datos: DatosServicio) => post<Servicio>('/admin/servicios', datos)

export const actualizarServicio = (servicioId: number, datos: DatosServicio) =>
  put<Servicio>(`/admin/servicios/${servicioId}`, datos)
