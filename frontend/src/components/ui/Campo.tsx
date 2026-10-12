import type { ReactElement } from 'react'

type Props = {
  etiqueta: string
  className?: string
  children: ReactElement // un <input>, <textarea> o <select>
}

// Da el mismo estilo a todos los campos de los formularios.
const estiloDelCampo =
  '[&_:is(input,textarea,select)]:rounded-lg [&_:is(input,textarea,select)]:border [&_:is(input,textarea,select)]:border-gray-300 [&_:is(input,textarea,select)]:px-3 [&_:is(input,textarea,select)]:py-2.5 [&_:is(input,textarea,select)]:text-base [&_:is(input,textarea,select)]:font-normal [&_:is(input,textarea,select)]:focus:border-marca-500 [&_:is(input,textarea,select)]:focus:outline-none'

export function Campo({ etiqueta, className = '', children }: Props) {
  return (
    <label
      className={`flex flex-col gap-1 text-sm font-medium text-gray-700 ${estiloDelCampo} ${className}`}
    >
      {etiqueta}
      {children}
    </label>
  )
}
