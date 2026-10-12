import type { FormEvent } from 'react'
import { Campo } from '@/components/ui/Campo'
import type { DatosCliente } from './api'

type Props = {
  id: string // el botón de enviar está en el resumen y apunta a este formulario por su id
  onEnviar: (datos: DatosCliente) => void
}

export function FormularioCliente({ id, onEnviar }: Props) {
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    onEnviar({
      cliente_nombre: String(campos.get('nombre')),
      cliente_email: String(campos.get('email')),
      cliente_telefono: String(campos.get('telefono')),
    })
  }

  return (
    <form id={id} onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre y apellido" className="sm:col-span-2">
        <input name="nombre" required minLength={2} maxLength={100} autoComplete="name" />
      </Campo>
      <Campo etiqueta="Email">
        <input name="email" type="email" required autoComplete="email" />
      </Campo>
      <Campo etiqueta="Teléfono">
        <input
          name="telefono"
          type="tel"
          required
          minLength={8}
          maxLength={20}
          autoComplete="tel"
          placeholder="+56 9 1234 5678"
        />
      </Campo>
    </form>
  )
}
