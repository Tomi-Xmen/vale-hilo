import { useQuery } from '@tanstack/react-query'
import { getHealth } from './api'

export function HealthStatus() {
  const { data, isPending, isError } = useQuery({ queryKey: ['health'], queryFn: getHealth })

  if (isPending) return <p className="text-gray-500">Cargando…</p>
  if (isError)
    return <p className="text-red-600">Error: el backend o la base de datos no responden</p>

  return (
    <p className="text-green-700">
      Backend: {data.status} · Base de datos: {data.db}
    </p>
  )
}
