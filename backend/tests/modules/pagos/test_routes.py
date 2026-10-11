from datetime import datetime

from app.extensions import db
from app.modules.pagos.models import EstadoPago, Pago
from app.modules.reservas.models import EstadoReserva


def iniciar_pago(client, reserva):
    return client.post("/api/pagos", json={"reserva_id": reserva.id})


def el_unico_pago():
    return db.session.scalars(db.select(Pago)).one()


# --- POST /api/pagos ---------------------------------------------------------


def test_iniciar_pago_crea_la_transaccion_en_webpay(client, webpay_falso, reserva_pendiente):
    response = iniciar_pago(client, reserva_pendiente)

    assert response.status_code == 201
    assert response.get_json() == {"url": "https://webpay.falso/pagar", "token": "token-1"}
    assert webpay_falso.transacciones_creadas == [
        {
            "orden_compra": f"R{reserva_pendiente.id}-P1",
            "monto": 4500,
            "url_retorno": "http://localhost:5173/api/pagos/retorno",
        }
    ]
    assert el_unico_pago().estado == EstadoPago.INICIADO


def test_no_se_puede_pagar_una_reserva_expirada(
    client, webpay_falso, reserva_pendiente, fijar_hora
):
    fijar_hora(datetime(2026, 10, 11, 20, 15))  # el bloqueo expiró a las 20:10

    response = iniciar_pago(client, reserva_pendiente)

    assert response.status_code == 409
    assert webpay_falso.transacciones_creadas == []


def test_no_se_puede_pagar_una_reserva_inexistente(client, webpay_falso):
    response = client.post("/api/pagos", json={"reserva_id": 999})

    assert response.status_code == 409


def test_si_webpay_falla_no_queda_un_pago_a_medias(client, webpay_falso, reserva_pendiente):
    webpay_falso.fallar_al_iniciar = True

    response = iniciar_pago(client, reserva_pendiente)

    assert response.status_code == 502
    assert db.session.scalars(db.select(Pago)).all() == []


# --- Retorno desde Webpay ----------------------------------------------------


def test_pago_aprobado_confirma_la_reserva(client, webpay_falso, reserva_pendiente):
    iniciar_pago(client, reserva_pendiente)

    response = client.get("/api/pagos/retorno?token_ws=token-1")

    assert response.status_code == 302
    assert response.location == f"http://localhost:5173/reservas/{reserva_pendiente.id}"
    pago = el_unico_pago()
    assert pago.estado == EstadoPago.APROBADO
    assert pago.ultimos_digitos_tarjeta == "6623"
    assert reserva_pendiente.estado == EstadoReserva.CONFIRMADA
    assert reserva_pendiente.expira_en is None


def test_webpay_tambien_puede_volver_por_post(client, webpay_falso, reserva_pendiente):
    iniciar_pago(client, reserva_pendiente)

    client.post("/api/pagos/retorno", data={"token_ws": "token-1"})

    assert reserva_pendiente.estado == EstadoReserva.CONFIRMADA


def test_pago_rechazado_deja_la_reserva_esperando_otro_intento(
    client, webpay_falso, reserva_pendiente
):
    webpay_falso.aprobar_pagos = False
    iniciar_pago(client, reserva_pendiente)

    client.get("/api/pagos/retorno?token_ws=token-1")

    assert el_unico_pago().estado == EstadoPago.RECHAZADO
    assert reserva_pendiente.estado == EstadoReserva.PENDIENTE_PAGO
    assert client.get(f"/api/reservas/{reserva_pendiente.id}").get_json()["puede_pagar"] is True


def test_cliente_cancela_en_webpay(client, webpay_falso, reserva_pendiente):
    iniciar_pago(client, reserva_pendiente)

    client.post(
        "/api/pagos/retorno",
        data={"TBK_TOKEN": "token-1", "TBK_ORDEN_COMPRA": "R1-P1", "TBK_ID_SESION": "1"},
    )

    assert el_unico_pago().estado == EstadoPago.RECHAZADO
    assert webpay_falso.confirmaciones == []  # un pago cancelado no se confirma


def test_se_acaba_el_tiempo_en_webpay(client, webpay_falso, reserva_pendiente):
    iniciar_pago(client, reserva_pendiente)

    client.post(
        "/api/pagos/retorno",
        data={"TBK_ORDEN_COMPRA": "R1-P1", "TBK_ID_SESION": str(reserva_pendiente.id)},
    )

    assert el_unico_pago().estado == EstadoPago.RECHAZADO


def test_recargar_la_pagina_de_retorno_no_confirma_dos_veces(
    client, webpay_falso, reserva_pendiente
):
    iniciar_pago(client, reserva_pendiente)

    client.get("/api/pagos/retorno?token_ws=token-1")
    client.get("/api/pagos/retorno?token_ws=token-1")

    assert webpay_falso.confirmaciones == ["token-1"]


def test_si_otro_tomo_la_hora_mientras_pagaba_se_devuelve_el_dinero(
    client, webpay_falso, reserva_pendiente, crear_reserva_en_bd, fijar_hora
):
    iniciar_pago(client, reserva_pendiente)
    # El cliente se demoró: el bloqueo expiró y otra persona reservó y pagó la misma hora.
    fijar_hora(datetime(2026, 10, 11, 20, 12))
    crear_reserva_en_bd(
        reserva_pendiente.servicio,
        inicio=datetime(2026, 10, 12, 10, 0),
        fin=datetime(2026, 10, 12, 11, 0),
        estado=EstadoReserva.CONFIRMADA,
    )

    client.get("/api/pagos/retorno?token_ws=token-1")

    assert webpay_falso.reembolsos == [{"token": "token-1", "monto": 4500}]
    assert el_unico_pago().estado == EstadoPago.REEMBOLSADO
    assert reserva_pendiente.estado == EstadoReserva.PENDIENTE_PAGO


def test_retorno_con_token_desconocido(client, webpay_falso):
    response = client.get("/api/pagos/retorno?token_ws=no-existe")

    assert response.location == "http://localhost:5173/?pago=error"
