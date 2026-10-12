import { useState } from 'react'
import { Boton } from '@/components/ui/Boton'
import { formatDuracion, formatPrecio } from '@/lib/format'
import { FormularioServicio } from './FormularioServicio'
import { useServiciosAdmin } from './hooks'

// "nuevo" = formulario para crear; un número = id del servicio que se está editando.
type Edicion = 'nuevo' | number | null

// Panel: la dueña crea servicios, cambia precios y decide cuáles ven los clientes.
export function ServiciosAdminPage() {
  const servicios = useServiciosAdmin()
  const [editando, setEditando] = useState<Edicion>(null)
  const cerrarFormulario = () => setEditando(null)

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Servicios</h1>
        {editando !== 'nuevo' && <Boton onClick={() => setEditando('nuevo')}>Nuevo servicio</Boton>}
      </div>

      {editando === 'nuevo' && (
        <div className="mb-6">
          <FormularioServicio onListo={cerrarFormulario} />
        </div>
      )}

      {servicios.isPending && <p className="text-gray-500">Cargando servicios…</p>}
      {servicios.isError && <p className="text-red-600">No pudimos cargar los servicios.</p>}
      {servicios.data?.length === 0 && (
        <p className="text-gray-500">Todavía no hay servicios. Crea el primero.</p>
      )}

      <ul className="space-y-3">
        {servicios.data?.map((servicio) => (
          <li key={servicio.id}>
            {editando === servicio.id ? (
              <FormularioServicio servicio={servicio} onListo={cerrarFormulario} />
            ) : (
              <article className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{servicio.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrecio(servicio.precio)} · {formatDuracion(servicio.duracion_minutos)}
                  </p>
                </div>
                {!servicio.activo && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    Oculto para clientes
                  </span>
                )}
                <Boton variante="secundario" onClick={() => setEditando(servicio.id)}>
                  Editar
                </Boton>
              </article>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
