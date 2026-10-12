DATOS_SERVICIO = {
    "nombre": "Manicure",
    "descripcion": "Esmaltado permanente",
    "precio": 12000,
    "duracion_minutos": 45,
}


def nombres(response):
    return [servicio["nombre"] for servicio in response.get_json()]


def test_el_panel_ve_tambien_los_servicios_desactivados(client_admin, crear_servicio):
    crear_servicio(nombre="Barba", activo=False)
    crear_servicio(nombre="Corte")

    response = client_admin.get("/api/admin/servicios")

    assert nombres(response) == ["Corte", "Barba"]  # activos primero


def test_crear_servicio(client_admin, client):
    response = client_admin.post("/api/admin/servicios", json=DATOS_SERVICIO)

    assert response.status_code == 201
    assert response.get_json()["activo"] is True
    assert nombres(client.get("/api/servicios")) == ["Manicure"]  # ya lo ven los clientes


def test_descripcion_vacia_queda_sin_descripcion(client_admin):
    response = client_admin.post(
        "/api/admin/servicios", json=DATOS_SERVICIO | {"descripcion": "   "}
    )

    assert response.get_json()["descripcion"] is None


def test_no_acepta_precio_ni_duracion_invalidos(client_admin):
    response = client_admin.post(
        "/api/admin/servicios", json=DATOS_SERVICIO | {"precio": 0, "duracion_minutos": 0}
    )

    assert response.status_code == 400
    campos_con_error = {detalle["loc"][0] for detalle in response.get_json()["detalles"]}
    assert campos_con_error == {"precio", "duracion_minutos"}


def test_editar_servicio(client_admin, crear_servicio):
    servicio = crear_servicio(nombre="Corte", precio=15000)

    response = client_admin.put(
        f"/api/admin/servicios/{servicio.id}",
        json=DATOS_SERVICIO | {"nombre": "Corte", "precio": 18000},
    )

    assert response.status_code == 200
    assert response.get_json()["precio"] == 18000


def test_desactivar_servicio_lo_oculta_a_los_clientes(client_admin, client, crear_servicio):
    servicio = crear_servicio(nombre="Corte")

    client_admin.put(
        f"/api/admin/servicios/{servicio.id}",
        json=DATOS_SERVICIO | {"nombre": "Corte", "activo": False},
    )

    assert nombres(client.get("/api/servicios")) == []


def test_editar_servicio_inexistente(client_admin):
    response = client_admin.put("/api/admin/servicios/999", json=DATOS_SERVICIO)

    assert response.status_code == 404
