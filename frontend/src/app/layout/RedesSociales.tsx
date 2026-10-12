import { MARCA } from '@/app/marca'
import { IconoInstagram, IconoMensaje } from '@/components/ui/iconos'
import { enlaceWhatsApp } from '@/lib/telefono'

const estiloEnlace =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-tinta transition hover:bg-marca-100'

export function RedesSociales() {
  return (
    <nav aria-label="Redes sociales" className="flex items-center gap-1">
      <a
        href={`https://instagram.com/${MARCA.instagram}`}
        target="_blank"
        rel="noreferrer"
        className={estiloEnlace}
      >
        <IconoInstagram />
        <span className="hidden sm:inline">@{MARCA.instagram}</span>
        <span className="sr-only sm:hidden">Instagram</span>
      </a>
      {MARCA.whatsapp && (
        <a
          href={enlaceWhatsApp(MARCA.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className={estiloEnlace}
        >
          <IconoMensaje />
          <span className="hidden sm:inline">WhatsApp</span>
          <span className="sr-only sm:hidden">WhatsApp</span>
        </a>
      )}
    </nav>
  )
}
