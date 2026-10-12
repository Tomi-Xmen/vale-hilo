import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { CLAVE_SESION } from '@/features/auth/api'
import { HttpError } from '@/lib/http'

/**
 * Crea el cliente de React Query de la app. Los tests usan esta misma función.
 *
 * Si cualquier llamada del panel responde 401 (la sesión expiró), se marca la sesión
 * como cerrada y el panel manda a la dueña a iniciar sesión de nuevo.
 */
export function crearQueryClient({ reintentar = true } = {}) {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: (error) => alPerderLaSesion(error) }),
    mutationCache: new MutationCache({ onError: (error) => alPerderLaSesion(error) }),
    defaultOptions: {
      queries: { retry: reintentar ? 1 : false },
      mutations: { retry: false },
    },
  })

  function alPerderLaSesion(error: Error) {
    if (error instanceof HttpError && error.status === 401) {
      queryClient.setQueryData(CLAVE_SESION, null)
    }
  }

  return queryClient
}
