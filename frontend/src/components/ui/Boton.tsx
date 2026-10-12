import type { ButtonHTMLAttributes } from 'react'
import { estilosBoton, type Variante } from './estilosBoton'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }

export function Boton({ variante = 'principal', className = '', ...props }: Props) {
  return <button className={`${estilosBoton(variante)} ${className}`} {...props} />
}
