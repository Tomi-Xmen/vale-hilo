def datos_reserva(servicio_id, inicio="2026-10-12T10:00:00"):
    return {
        "servicio_id": servicio_id,
        "inicio": inicio,
        "cliente_nombre": "Ana Pérez",
        "cliente_email": "ana@correo.cl",
        "cliente_telefono": "+56912345678",
    }


# --- GET /api/disponibilidad -------------------------------------------------


def test_disponibilidad_devuelve_horas_del_dia(client, crear_servicio):
    servicio = crear_servicio(precio=15000)

    response = client.get(f"/api/disponibilidad?servicio_id={servicio.id}&fecha=2026-10-12")

    assert response.status_code == 200
    datos = response.get_json()
    assert datos["fecha"] == "2026-10-12"
    assert datos["horas"][:2] == ["10:00", "10:30"]
    assert datos["monto_abono"] == 4500


def test_disponibilidad_sin_parametros_es_invalida(client):
    response = client.get("/api/disponibilidad")

    assert response.status_code == 400


def test_disponibilidad_de_servicio_inexistente(client):
    response = client.get("/api/disponibilidad?servicio_id=999&fecha=2026-10-12")

    assert response.status_code == 404


# --- POST /api/reservas ------------------------------------------------------


def test_reservar_devuelve_la_reserva_creada(client, crear_servicio):
    servicio = crear_servicio(precio=20000, duracion_minutos=60)

    response = client.post("/api/reservas", json=datos_reserva(servicio.id))

    assert response.status_code == 201
    reserva = response.get_json()
    assert reserva["inicio"] == "2026-10-12T10:00:00"
    assert reserva["fin"] == "2026-10-12T11:00:00"
    assert reserva["estado"] == "pendiente_pago"
    assert reserva["monto_abono"] == 6000


def test_reservar_la_misma_hora_dos_veces(client, crear_servicio):
    servicio = crear_servicio()
    client.post("/api/reservas", json=datos_reserva(servicio.id))

    response = client.post("/api/reservas", json=datos_reserva(servicio.id))

    assert response.status_code == 409


def test_reservar_con_email_invalido(client, crear_servicio):
    servicio = crear_servicio()
    datos = datos_reserva(servicio.id) | {"cliente_email": "no-es-un-email"}

    response = client.post("/api/reservas", json=datos)

    assert response.status_code == 400
    campos_con_error = [detalle["loc"][0] for detalle in response.get_json()["detalles"]]
    assert campos_con_error == ["cliente_email"]


def test_reservar_con_hora_en_utc_se_convierte_a_hora_de_chile(client, crear_servicio):
    servicio = crear_servicio()

    # En octubre Chile está en UTC-3: 13:00 UTC son las 10:00 en Chile.
    response = client.post("/api/reservas", json=datos_reserva(servicio.id, "2026-10-12T13:00:00Z"))

    assert response.status_code == 201
    assert response.get_json()["inicio"] == "2026-10-12T10:00:00"


# --- GET /api/reservas/<id> --------------------------------------------------


def test_ver_reserva(client, crear_servicio):
    servicio = crear_servicio(nombre="Corte de pelo")
    creada = client.post("/api/reservas", json=datos_reserva(servicio.id)).get_json()

    response = client.get(f"/api/reservas/{creada['id']}")

    assert response.status_code == 200
    reserva = response.get_json()
    assert reserva["servicio_nombre"] == "Corte de pelo"
    assert reserva["puede_pagar"] is True
    assert "cliente_email" not in reserva


def test_ver_reserva_inexistente(client):
    assert client.get("/api/reservas/999").status_code == 404
