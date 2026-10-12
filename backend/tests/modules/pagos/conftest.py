from datetime import datetime

import pytest

from app.modules.reservas.models import EstadoReserva


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
