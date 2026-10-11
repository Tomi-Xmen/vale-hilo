from datetime import datetime

import pytest

from app.modules.pagos import webpay
from app.modules.pagos.webpay import ErrorWebpay, ResultadoPago, TransaccionIniciada
from app.modules.reservas.models import EstadoReserva


class WebpayFalso:
    """Reemplaza a Webpay en los tests: no llama a Transbank y anota lo que se le pidió."""

    def __init__(self):
        self.aprobar_pagos = True
        self.fallar_al_iniciar = False
        self.transacciones_creadas = []
        self.confirmaciones = []
        self.reembolsos = []

    def iniciar_transaccion(self, orden_compra, id_sesion, monto, url_retorno):
        if self.fallar_al_iniciar:
            raise ErrorWebpay("Webpay no responde")
        self.transacciones_creadas.append(
            {"orden_compra": orden_compra, "monto": monto, "url_retorno": url_retorno}
        )
        token = f"token-{len(self.transacciones_creadas)}"
        return TransaccionIniciada(token=token, url="https://webpay.falso/pagar")

    def confirmar_transaccion(self, token):
        self.confirmaciones.append(token)
        if not self.aprobar_pagos:
            return ResultadoPago(
                aprobado=False, codigo_autorizacion=None, ultimos_digitos_tarjeta=None
            )
        return ResultadoPago(
            aprobado=True, codigo_autorizacion="1213", ultimos_digitos_tarjeta="6623"
        )

    def reembolsar(self, token, monto):
        self.reembolsos.append({"token": token, "monto": monto})


@pytest.fixture
def webpay_falso(monkeypatch):
    falso = WebpayFalso()
    monkeypatch.setattr(webpay, "iniciar_transaccion", falso.iniciar_transaccion)
    monkeypatch.setattr(webpay, "confirmar_transaccion", falso.confirmar_transaccion)
    monkeypatch.setattr(webpay, "reembolsar", falso.reembolsar)
    return falso


@pytest.fixture
def reserva_pendiente(crear_servicio, crear_reserva_en_bd):
    """Reserva del lunes 12 a las 10:00, esperando pago (expira 10 minutos después de "ahora")."""
    return crear_reserva_en_bd(
        crear_servicio(),
        inicio=datetime(2026, 10, 12, 10, 0),
        fin=datetime(2026, 10, 12, 11, 0),
        estado=EstadoReserva.PENDIENTE_PAGO,
        expira_en=datetime(2026, 10, 11, 20, 10),
        monto_abono=4500,
    )
