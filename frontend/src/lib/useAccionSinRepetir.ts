import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'

type Opciones = {
  onError?: (error: Error) => void
}

/**
 * Ejecuta una acción (ej. reservar y pagar) una sola vez, aunque el cliente haga doble
 * click o apriete Enter varias veces. Si la acción falla, se puede volver a intentar.
 */
export function useAccionSinRepetir<T>(
  accion: (datos: T) => Promise<void>,
  opciones: Opciones = {},
) {
  // Un ref cambia al instante; el estado de React recién en el siguiente render, y un
  // segundo click muy rápido alcanzaría a pasar antes de que el botón se desactive.
  const enCurso = useRef(false)

  const mutacion = useMutation({
    mutationFn: accion,
    onError: (error) => {
      enCurso.current = false
      opciones.onError?.(error)
    },
  })

  function ejecutar(datos: T) {
    if (enCurso.current) return
    enCurso.current = true
    mutacion.mutate(datos)
  }

  return {
    ejecutar,
    // Si salió bien, el navegador se está yendo a Webpay: se mantiene bloqueado.
    bloqueada: mutacion.isPending || mutacion.isSuccess,
    error: mutacion.error,
  }
}
