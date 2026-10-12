// Íconos de línea simples (24x24) que toman el color del texto que los rodea.

type Props = { className?: string }

export function IconoInstagram({ className = 'h-5 w-5' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconoMensaje({ className = 'h-5 w-5' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.7-5.2A8.4 8.4 0 1 1 21 11.5Z" />
    </svg>
  )
}
