import { get } from '@/lib/http'

export type Health = {
  status: string
  db: string
}

export const getHealth = () => get<Health>('/health')
