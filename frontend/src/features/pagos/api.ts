import { post } from '@/lib/http'

type TransaccionWebpay = {
  url: string
  token: string
}

/** Crea el pago en Webpay y lleva al cliente a la página de pago. */
export async function pagarReserva(reservaId: number) {
  const transaccion = await post<TransaccionWebpay>('/pagos', { reserva_id: reservaId })
  irAWebpay(transaccion)
}

// Webpay exige que se llegue a su página con un formulario POST que lleve el token.
function irAWebpay({ url, token }: TransaccionWebpay) {
  const formulario = document.createElement('form')
  formulario.method = 'POST'
  formulario.action = url

  const campoToken = document.createElement('input')
  campoToken.type = 'hidden'
  campoToken.name = 'token_ws'
  campoToken.value = token

  formulario.appendChild(campoToken)
  document.body.appendChild(formulario)
  formulario.submit()
}
