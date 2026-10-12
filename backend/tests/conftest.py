from datetime import datetime

import pytest

from app import create_app
from app.extensions import db
from app.modules.auth.service import crear_administrador
from app.modules.pagos import webpay
from app.modules.pagos.webpay import ErrorWebpay, ResultadoPago, TransaccionIniciada
from app.modules.reservas import service as reservas_service
from app.modules.reservas.models import Reserva
from app.modules.servicios.models import Servicio


@pytest.fixture
def app():
    app = create_app("testing")
    # Cada test parte con tablas vacías en una base SQLite en memoria.
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def fijar_hora(monkeypatch):
    """Cambia la "hora actual" que ve el módulo de reservas."""

    def _fijar(momento):
        monkeypatch.setattr(reservas_service, "ahora", lambda: momento)

    return _fijar


@pytest.fixture(autouse=True)
def hora_actual(fijar_hora):
    # Todos los tests corren el domingo 11/10/2026 a las 20:00, así el resultado
    # no depende del día en que se ejecuten. El lunes 12 queda completo y en el futuro.
    fijar_hora(datetime(2026, 10, 11, 20, 0))


@pytest.fixture
def crear_servicio(app):
    """Crea un servicio en la base de datos. Se pueden cambiar los valores por defecto."""

    def _crear(**datos):
        valores = {"nombre": "Corte", "precio": 15000, "duracion_minutos": 60} | datos
        servicio = Servicio(**valores)
        db.session.add(servicio)
        db.session.commit()
        return servicio

    return _crear


@pytest.fixture
def crear_reserva_en_bd(app):
    """Guarda una reserva directo en la base de datos, sin pasar por las validaciones."""

    def _crear(servicio, inicio, fin, estado, expira_en=None, monto_abono=4500):
        reserva = Reserva(
            servicio_id=servicio.id,
            cliente_nombre="Otra persona",
            cliente_email="otra@correo.cl",
            cliente_telefono="+56900000000",
            inicio=inicio,
            fin=fin,
            estado=estado,
            monto_abono=monto_abono,
            expira_en=expira_en,
        )
        db.session.add(reserva)
        db.session.commit()
        return reserva

    return _crear


class WebpayFalso:
    """Reemplaza a Webpay en los tests: no llama a Transbank y anota lo que se le pidió."""

    def __init__(self):
        self.aprobar_pagos = True
        self.fallar_al_iniciar = False
        self.fallar_al_reembolsar = False
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
        if self.fallar_al_reembolsar:
            raise ErrorWebpay("Webpay no responde")
        self.reembolsos.append({"token": token, "monto": monto})


@pytest.fixture
def webpay_falso(monkeypatch):
    falso = WebpayFalso()
    monkeypatch.setattr(webpay, "iniciar_transaccion", falso.iniciar_transaccion)
    monkeypatch.setattr(webpay, "confirmar_transaccion", falso.confirmar_transaccion)
    monkeypatch.setattr(webpay, "reembolsar", falso.reembolsar)
    return falso


@pytest.fixture
def admin(app):
    return crear_administrador("duena@negocio.cl", "clave-de-prueba-123")


@pytest.fixture
def client_admin(client, admin):
    """Cliente HTTP con la sesión de la dueña ya iniciada."""
    client.post("/api/auth/login", json={"email": admin.email, "clave": "clave-de-prueba-123"})
    return client


@pytest.fixture
def correos(app):
    """Emails que la app "envió" durante el test (en los tests no se envía nada de verdad)."""
    return app.extensions.setdefault("correos_enviados", [])
