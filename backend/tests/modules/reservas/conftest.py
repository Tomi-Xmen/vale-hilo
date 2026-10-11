from datetime import datetime

import pytest

from app.extensions import db
from app.modules.reservas import service
from app.modules.reservas.models import Reserva


@pytest.fixture
def fijar_hora(monkeypatch):
    """Cambia la "hora actual" que ve el módulo de reservas."""

    def _fijar(momento):
        monkeypatch.setattr(service, "ahora", lambda: momento)

    return _fijar


@pytest.fixture(autouse=True)
def hora_actual(fijar_hora):
    # Por defecto los tests corren el domingo 11/10/2026 a las 20:00,
    # así el lunes 12 (el día que más se usa en los tests) está completo y en el futuro.
    fijar_hora(datetime(2026, 10, 11, 20, 0))


@pytest.fixture
def crear_reserva_en_bd(app):
    """Guarda una reserva directo en la base de datos, sin pasar por las validaciones."""

    def _crear(servicio, inicio, fin, estado, expira_en=None):
        reserva = Reserva(
            servicio_id=servicio.id,
            cliente_nombre="Otra persona",
            cliente_email="otra@correo.cl",
            cliente_telefono="+56900000000",
            inicio=inicio,
            fin=fin,
            estado=estado,
            monto_abono=0,
            expira_en=expira_en,
        )
        db.session.add(reserva)
        db.session.commit()
        return reserva

    return _crear
