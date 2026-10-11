from flask import Blueprint, current_app, redirect, request

from app.modules.pagos.schemas import PagoIn
from app.modules.pagos.service import ReservaNoPagable, iniciar_pago, procesar_retorno
from app.modules.pagos.webpay import ErrorWebpay

bp = Blueprint("pagos", __name__)


@bp.post("/pagos")
def pagar():
    datos = PagoIn.model_validate(request.get_json(silent=True) or {})

    try:
        transaccion = iniciar_pago(datos.reserva_id)
    except ReservaNoPagable:
        return {"error": "La reserva no existe o se acabó el tiempo para pagarla"}, 409
    except ErrorWebpay:
        return {"error": "No pudimos conectar con Webpay. Intenta de nuevo."}, 502

    # El frontend debe enviar al cliente a `url` con un formulario POST que lleve `token_ws`.
    return {"url": transaccion.url, "token": transaccion.token}, 201


# Webpay devuelve al cliente acá. Puede llegar por GET o por POST según cómo terminó el pago.
@bp.route("/pagos/retorno", methods=["GET", "POST"])
def volver_de_webpay():
    pago = procesar_retorno(
        token_ws=request.values.get("token_ws"),
        tbk_token=request.values.get("TBK_TOKEN"),
        tbk_id_sesion=request.values.get("TBK_ID_SESION"),
    )

    url_app = current_app.config["URL_PUBLICA"]
    if pago is None:
        return redirect(f"{url_app}/?pago=error")
    return redirect(f"{url_app}/reservas/{pago.reserva_id}")
