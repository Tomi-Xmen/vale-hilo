/**
 * Enlace para escribirle al cliente por WhatsApp.
 * Acepta "+56 9 1234 5678", "56912345678" o "912345678" (se asume Chile si falta el código).
 */
export function enlaceWhatsApp(telefono: string) {
  let digitos = telefono.replace(/\D/g, '')
  if (digitos.length === 9 && digitos.startsWith('9')) digitos = `56${digitos}`
  return `https://wa.me/${digitos}`
}
