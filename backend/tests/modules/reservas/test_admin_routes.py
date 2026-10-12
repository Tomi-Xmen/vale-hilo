from datetime import datetime

import pytest

from app.extensions import db
from app.modules.pagos.models import EstadoPago, Pago
from app.modules.reservas.models import EstadoReserva


def a_las(hora, minuto=0, dia=12):
    return datetime(2026, 10, dia, hora, minuto)


@pytest.fixture
def servicio(crear_servicio):
    return crear_servicio(nombre="Corte", duracion_minutos=60)


@pytest.fixture
def reserva_pagada(servicio, crear_reserva_en_bd):
    """Reserva confirmada del lunes 12 a las 10:00, con su abono de $4.500 pagado."""
    reserva = crear_reserva_en_bd(
        servicio, inicio=a_las(10), fin=a_las(11), estado=EstadoReserva.CONFIRMADA
    )
    db.session.add(
        Pago(reserva_id=reserva.id, monto=4500, estado=EstadoPago.APROBADO, token="token-pagado")
    )
    db.session.commit()
    return reserva


def cancelar(client, reserva, devolver_abono):
    return client.post(
        f"/api/admin/reservas/{reserva.id}/cancelar", json={"devolver_abono": devolver_abono}
    )


def horas_libres_del_lunes(client, servicio):
    url = f"/api/disponibilidad?servicio_id={servicio.id}&fecha=2026-10-12"
    return client.get(url).get_json()["horas"]


# --- Agenda del día ----------------------------------------------------------


def test_agenda_muestra_las_reservas_del_dia_con_el_contacto(
    client_admin, servicio, crear_reserva_en_bd
):
    crear_reserva_en_bd(servicio, a_las(15), a_las(16), EstadoReserva.CONFIRMADA)
    crear_reserva_en_bd(servicio, a_las(10), a_las(11), EstadoReserva.CANCELADA)
    crear_reserva_en_bd(
        servicio, a_las(12), a_las(13), EstadoReserva.PENDIENTE_PAGO, expira_en=a_las(20, 5, 11)
    )

    reservas = client_admin.get("/api/admin/reservas?fecha=2026-10-12").get_json()

    assert [r["inicio"][11:16] for r in reservas] == ["10:00", "12:00", "15:00"]
    assert [r["estado"] for r in reservas] == ["cancelada", "pendiente_pago", "confirmada"]
    assert reservas[0]["cliente_telefono"] == "+56900000000"
    assert reservas[0]["servicio_nombre"] == "Corte"


def test_agenda_omite_pendientes_que_nunca_se_pagaron(client_admin, servicio, crear_reserva_en_bd):
    crear_reserva_en_bd(
        servicio, a_las(10), a_las(11), EstadoReserva.PENDIENTE_PAGO, expira_en=a_las(19, 0, 11)
    )

    assert client_admin.get("/api/admin/reservas?fecha=2026-10-12").get_json() == []


def test_agenda_solo_muestra_el_dia_pedido(client_admin, servicio, crear_reserva_en_bd):
    crear_reserva_en_bd(servicio, a_las(10, dia=13), a_las(11, dia=13), EstadoReserva.CONFIRMADA)

    assert client_admin.get("/api/admin/reservas?fecha=2026-10-12").get_json() == []


# --- Cancelar ----------------------------------------------------------------


def test_cancelar_sin_devolver_el_abono_libera_la_hora(
    client_admin, webpay_falso, servicio, reserva_pagada
):
    assert "10:00" not in horas_libres_del_lunes(client_admin, servicio)

    response = cancelar(client_admin, reserva_pagada, devolver_abono=False)

    assert response.status_code == 200
    assert response.get_json()["estado"] == "cancelada"
    assert webpay_falso.reembolsos == []
    assert "10:00" in horas_libres_del_lunes(client_admin, servicio)


def test_cancelar_devolviendo_el_abono(client_admin, webpay_falso, reserva_pagada):
    response = cancelar(client_admin, reserva_pagada, devolver_abono=True)

    assert response.status_code == 200
    assert webpay_falso.reembolsos == [{"token": "token-pagado", "monto": 4500}]
    pago = db.session.scalars(db.select(Pago)).one()
    assert pago.estado == EstadoPago.REEMBOLSADO


def test_si_webpay_no_devuelve_el_abono_la_reserva_no_se_cancela(
    client_admin, webpay_falso, reserva_pagada
):
    webpay_falso.fallar_al_reembolsar = True

    response = cancelar(client_admin, reserva_pagada, devolver_abono=True)

    assert response.status_code == 502
    assert reserva_pagada.estado == EstadoReserva.CONFIRMADA


def test_no_se_puede_devolver_un_abono_que_no_se_pago(
    client_admin, webpay_falso, servicio, crear_reserva_en_bd
):
    reserva = crear_reserva_en_bd(servicio, a_las(10), a_las(11), EstadoReserva.CONFIRMADA)

    response = cancelar(client_admin, reserva, devolver_abono=True)

    assert response.status_code == 409
    assert reserva.estado == EstadoReserva.CONFIRMADA


def test_cancelar_dos_veces_no_devuelve_el_dinero_dos_veces(
    client_admin, webpay_falso, reserva_pagada
):
    primera = cancelar(client_admin, reserva_pagada, devolver_abono=True)
    segunda = cancelar(client_admin, reserva_pagada, devolver_abono=True)

    assert primera.status_code == 200
    assert segunda.status_code == 409
    assert len(webpay_falso.reembolsos) == 1


def test_cancelar_reserva_inexistente(client_admin):
    response = client_admin.post("/api/admin/reservas/999/cancelar", json={})

    assert response.status_code == 404
