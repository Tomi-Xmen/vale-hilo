from datetime import datetime

import pytest

from app import create_app
from app.extensions import db
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
