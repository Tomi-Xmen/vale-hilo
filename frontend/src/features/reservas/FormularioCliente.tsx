import type { FormEvent, ReactElement } from 'react'
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

type CampoProps = {
  etiqueta: string
  className?: string
  children: ReactElement
}

// Da el mismo estilo a todos los inputs del formulario.
function Campo({ etiqueta, className = '', children }: CampoProps) {
  return (
    <label
      className={`flex flex-col gap-1 text-sm font-medium text-gray-700 [&_input]:rounded-lg [&_input]:border [&_input]:border-gray-300 [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:font-normal [&_input]:focus:border-marca-500 [&_input]:focus:outline-none ${className}`}
    >
      {etiqueta}
      {children}
    </label>
  )
}
