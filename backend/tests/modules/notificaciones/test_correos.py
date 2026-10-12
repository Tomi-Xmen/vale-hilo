import smtplib
from datetime import datetime

import pytest

from app.extensions import db
from app.modules.notificaciones.formato import formatear_fecha_y_hora, formatear_pesos
from app.modules.pagos.models import EstadoPago, Pago
from app.modules.reservas.models import EstadoReserva


def texto_de(correo):
    return correo.get_body(preferencelist=("plain",)).get_content()


def html_de(correo):
    return correo.get_body(preferencelist=("html",)).get_content()


@pytest.fixture
def reserva_pagando(crear_servicio, crear_reserva_en_bd):
    """Reserva del lunes 12 a las 10:00 de Ana, con un pago iniciado en Webpay."""
    reserva = crear_reserva_en_bd(
        crear_servicio(nombre="Corte de pelo"),
        inicio=datetime(2026, 10, 12, 10, 0),
        fin=datetime(2026, 10, 12, 11, 0),
        estado=EstadoReserva.PENDIENTE_PAGO,
        expira_en=datetime(2026, 10, 11, 20, 10),
    )
    reserva.cliente_nombre = "Ana Pérez"
    reserva.cliente_email = "ana@correo.cl"
    db.session.add(Pago(reserva_id=reserva.id, monto=4500, token="token-1"))
    db.session.commit()
    return reserva


def volver_de_webpay(client):
    client.get("/api/pagos/retorno?token_ws=token-1")


# --- Al confirmar el pago ----------------------------------------------------


def test_pago_aprobado_avisa_al_cliente_y_al_negocio(
    client, webpay_falso, correos, reserva_pagando
):
    volver_de_webpay(client)

    al_cliente, al_negocio = correos
    assert al_cliente["To"] == "ana@correo.cl"
    assert al_cliente["Subject"] == "Tu reserva está confirmada: lunes 12 de octubre a las 10:00"
    assert al_cliente["Reply-To"] == "duena@negocio.cl"  # si responde, le llega al negocio
    assert "Corte de pelo" in texto_de(al_cliente)
    assert "$4.500" in texto_de(al_cliente)

    assert al_negocio["To"] == "duena@negocio.cl"
    assert al_negocio["Subject"] == "Nueva reserva: Corte de pelo, lunes 12 de octubre a las 10:00"
    assert "Ana Pérez" in texto_de(al_negocio)
    assert "+56900000000" in texto_de(al_negocio)


def test_pago_rechazado_no_envia_emails(client, webpay_falso, correos, reserva_pagando):
    webpay_falso.aprobar_pagos = False

    volver_de_webpay(client)

    assert correos == []


def test_recargar_el_retorno_no_repite_los_emails(client, webpay_falso, correos, reserva_pagando):
    volver_de_webpay(client)
    volver_de_webpay(client)

    assert len(correos) == 2


def test_sin_email_del_negocio_solo_se_avisa_al_cliente(
    app, client, webpay_falso, correos, reserva_pagando
):
    app.config["EMAIL_NEGOCIO"] = None

    volver_de_webpay(client)

    assert [correo["To"] for correo in correos] == ["ana@correo.cl"]


def test_el_html_no_ejecuta_codigo_escrito_en_el_nombre(
    client, webpay_falso, correos, reserva_pagando
):
    reserva_pagando.cliente_nombre = "<script>alert(1)</script>"
    db.session.commit()

    volver_de_webpay(client)

    assert "<script>" not in html_de(correos[0])
    assert "&lt;script&gt;" in html_de(correos[0])


def test_si_el_email_falla_el_pago_queda_aprobado_igual(
    app, client, webpay_falso, reserva_pagando, monkeypatch
):
    def servidor_caido(*args, **kwargs):
        raise OSError("servidor de correo caído")

    app.config["MAIL_SUPRIMIR"] = False
    monkeypatch.setattr(smtplib, "SMTP", servidor_caido)

    response = client.get("/api/pagos/retorno?token_ws=token-1")

    assert response.status_code == 302
    assert reserva_pagando.estado == EstadoReserva.CONFIRMADA
    assert db.session.scalars(db.select(Pago)).one().estado == EstadoPago.APROBADO


# --- Al cancelar desde el panel ----------------------------------------------


def test_cancelar_avisa_al_cliente_que_se_devolvio_el_abono(
    client_admin, webpay_falso, correos, reserva_pagando
):
    volver_de_webpay(client_admin)
    correos.clear()

    client_admin.post(
        f"/api/admin/reservas/{reserva_pagando.id}/cancelar", json={"devolver_abono": True}
    )

    (aviso,) = correos
    assert aviso["To"] == "ana@correo.cl"
    assert aviso["Subject"] == "Tu reserva del lunes 12 de octubre a las 10:00 fue cancelada"
    assert "Te devolvimos el abono de $4.500" in texto_de(aviso)


def test_cancelar_sin_devolver_no_promete_devolucion(
    client_admin, webpay_falso, correos, reserva_pagando
):
    volver_de_webpay(client_admin)
    correos.clear()

    client_admin.post(
        f"/api/admin/reservas/{reserva_pagando.id}/cancelar", json={"devolver_abono": False}
    )

    assert "devolvimos" not in texto_de(correos[0])
    assert "dudas sobre tu abono" in texto_de(correos[0])


def test_cancelar_una_reserva_que_no_se_pago_no_envia_email(client_admin, correos, reserva_pagando):
    client_admin.post(f"/api/admin/reservas/{reserva_pagando.id}/cancelar", json={})

    assert correos == []


# --- Formatos ----------------------------------------------------------------


def test_fecha_y_pesos_en_espanol():
    assert (
        formatear_fecha_y_hora(datetime(2026, 12, 5, 9, 30)) == "sábado 5 de diciembre a las 09:30"
    )
    assert formatear_pesos(4500) == "$4.500"
    assert formatear_pesos(1250000) == "$1.250.000"
