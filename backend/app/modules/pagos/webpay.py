"""Único archivo que habla con Webpay Plus.

Si algún día se cambia de proveedor de pagos, solo hay que reescribir este archivo
manteniendo las mismas funciones.
"""

from dataclasses import dataclass

from flask import current_app
from transbank.common.integration_type import IntegrationType
from transbank.common.options import WebpayOptions
from transbank.error.transbank_error import TransbankError
from transbank.webpay.webpay_plus.transaction import Transaction


class ErrorWebpay(Exception):
    pass


@dataclass
class TransaccionIniciada:
    token: str
    url: str  # página de Webpay donde el cliente paga


@dataclass
class ResultadoPago:
    aprobado: bool
    codigo_autorizacion: str | None
    ultimos_digitos_tarjeta: str | None


def iniciar_transaccion(orden_compra, id_sesion, monto, url_retorno):
    try:
        respuesta = _transaccion().create(orden_compra, id_sesion, monto, url_retorno)
    except TransbankError as error:
        raise ErrorWebpay(error.message) from error
    return TransaccionIniciada(token=respuesta["token"], url=respuesta["url"])


def confirmar_transaccion(token):
    """Le pide a Webpay el resultado final del pago. Hay que llamarla siempre al volver."""
    try:
        respuesta = _transaccion().commit(token)
    except TransbankError as error:
        raise ErrorWebpay(error.message) from error

    # Webpay solo aprueba si el estado es AUTHORIZED y el código de respuesta es 0.
    aprobado = respuesta.get("status") == "AUTHORIZED" and respuesta.get("response_code") == 0
    tarjeta = respuesta.get("card_detail") or {}
    return ResultadoPago(
        aprobado=aprobado,
        codigo_autorizacion=respuesta.get("authorization_code"),
        ultimos_digitos_tarjeta=tarjeta.get("card_number"),
    )


def reembolsar(token, monto):
    try:
        _transaccion().refund(token, monto)
    except TransbankError as error:
        raise ErrorWebpay(error.message) from error


def _transaccion():
    config = current_app.config
    if config["WEBPAY_AMBIENTE"] == "produccion":
        ambiente = IntegrationType.LIVE
    else:
        ambiente = IntegrationType.TEST
    opciones = WebpayOptions(config["WEBPAY_CODIGO_COMERCIO"], config["WEBPAY_API_KEY"], ambiente)
    return Transaction(opciones)
