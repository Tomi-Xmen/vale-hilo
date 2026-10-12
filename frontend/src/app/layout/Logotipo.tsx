import { MARCA } from '@/app/marca'

// Por ahora el nombre escrito con la tipografía de la marca.
// Cuando llegue el logo, se reemplaza solo este componente por un <img>.
export function Logotipo({ className = 'text-2xl' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-wide text-tinta ${className}`}>
      {MARCA.nombre}
    </span>
  )
}
