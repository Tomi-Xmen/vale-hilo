import { useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Boton } from '@/components/ui/Boton'
import { Campo } from '@/components/ui/Campo'
import { HttpError } from '@/lib/http'
import { useAccionSinRepetir } from '@/lib/useAccionSinRepetir'
import { actualizarServicio, crearServicio, type DatosServicio, type Servicio } from './api'
import { CLAVE_SERVICIOS_ADMIN } from './hooks'

type Props = {
  servicio?: Servicio // si viene, se edita; si no, se crea uno nuevo
  onListo: () => void
}

export function FormularioServicio({ servicio, onListo }: Props) {
  const queryClient = useQueryClient()

  const guardar = useAccionSinRepetir(async (datos: DatosServicio) => {
    if (servicio) {
      await actualizarServicio(servicio.id, datos)
    } else {
      await crearServicio(datos)
    }
    // Se actualizan la lista del panel y la que ven los clientes.
    await queryClient.invalidateQueries({ queryKey: CLAVE_SERVICIOS_ADMIN })
    await queryClient.invalidateQueries({ queryKey: ['servicios'] })
    onListo()
  })

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    guardar.ejecutar({
      nombre: String(campos.get('nombre')),
      descripcion: String(campos.get('descripcion')) || null,
      precio: Number(campos.get('precio')),
      duracion_minutos: Number(campos.get('duracion_minutos')),
      activo: campos.get('activo') === 'on',
    })
  }

  return (
    <form
      onSubmit={enviar}
      className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      <Campo etiqueta="Nombre" className="sm:col-span-2">
        <input
          name="nombre"
          required
          minLength={2}
          maxLength={100}
          defaultValue={servicio?.nombre}
        />
      </Campo>
      <Campo etiqueta="Descripción (opcional)" className="sm:col-span-2">
        <textarea
          name="descripcion"
          rows={2}
          maxLength={1000}
          defaultValue={servicio?.descripcion ?? ''}
        />
      </Campo>
      <Campo etiqueta="Precio (pesos)">
        <input
          name="precio"
          type="number"
          required
          min={1}
          step={1}
          defaultValue={servicio?.precio}
        />
      </Campo>
      <Campo etiqueta="Duración (minutos)">
        <input
          name="duracion_minutos"
          type="number"
          required
          min={5}
          max={480}
          step={5}
          defaultValue={servicio?.duracion_minutos ?? 60}
        />
      </Campo>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input name="activo" type="checkbox" defaultChecked={servicio?.activo ?? true} />
        Visible para los clientes
      </label>

      {guardar.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {guardar.error instanceof HttpError && guardar.error.status === 400
            ? 'Revisa los datos: hay algún campo con un valor no válido.'
            : 'No pudimos guardar el servicio. Intenta de nuevo.'}
        </p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Boton type="submit" disabled={guardar.bloqueada}>
          {guardar.bloqueada ? 'Guardando…' : 'Guardar'}
        </Boton>
        <Boton type="button" variante="secundario" onClick={onListo} disabled={guardar.bloqueada}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}
