def test_listar_servicios_vacio(client):
    response = client.get("/api/servicios")

    assert response.status_code == 200
    assert response.get_json() == []


def test_listar_servicios_devuelve_campos(client, crear_servicio):
    servicio = crear_servicio(nombre="Corte", descripcion="Con lavado", duracion_minutos=45)

    response = client.get("/api/servicios")

    assert response.get_json() == [
        {
            "id": servicio.id,
            "nombre": "Corte",
            "descripcion": "Con lavado",
            "precio": 15000,
            "duracion_minutos": 45,
            "activo": True,
        }
    ]


def test_listar_servicios_excluye_inactivos(client, crear_servicio):
    crear_servicio(nombre="Corte")
    crear_servicio(nombre="Tintura", activo=False)

    response = client.get("/api/servicios")

    assert [s["nombre"] for s in response.get_json()] == ["Corte"]


def test_listar_servicios_ordena_por_nombre(client, crear_servicio):
    crear_servicio(nombre="Peinado")
    crear_servicio(nombre="Barba")
    crear_servicio(nombre="Manicure")

    response = client.get("/api/servicios")

    assert [s["nombre"] for s in response.get_json()] == ["Barba", "Manicure", "Peinado"]
