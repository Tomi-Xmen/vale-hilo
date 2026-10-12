import pytest

from app.extensions import db
from app.modules.auth.models import Administrador


def iniciar_sesion(client, email="duena@negocio.cl", clave="clave-de-prueba-123"):
    return client.post("/api/auth/login", json={"email": email, "clave": clave})


def test_iniciar_sesion_con_datos_correctos(client, admin):
    response = iniciar_sesion(client)

    assert response.status_code == 200
    assert client.get("/api/auth/sesion").get_json() == {"email": "duena@negocio.cl"}


def test_el_email_no_distingue_mayusculas_ni_espacios(client, admin):
    response = iniciar_sesion(client, email="  Duena@Negocio.cl ")

    assert response.status_code == 200


def test_clave_incorrecta(client, admin):
    response = iniciar_sesion(client, clave="otra-clave")

    assert response.status_code == 401
    assert client.get("/api/auth/sesion").status_code == 401


def test_email_inexistente_da_el_mismo_error_que_clave_incorrecta(client, admin):
    con_email_inexistente = iniciar_sesion(client, email="nadie@negocio.cl")
    con_clave_incorrecta = iniciar_sesion(client, clave="otra-clave")

    assert con_email_inexistente.status_code == 401
    assert con_email_inexistente.get_json() == con_clave_incorrecta.get_json()


def test_cerrar_sesion(client, admin):
    iniciar_sesion(client)

    client.post("/api/auth/logout")

    assert client.get("/api/auth/sesion").status_code == 401


def test_la_clave_no_se_guarda_en_texto_plano(admin):
    guardado = db.session.get(Administrador, admin.id)

    assert "clave-de-prueba-123" not in guardado.clave_hash


@pytest.mark.parametrize(
    "metodo, ruta",
    [
        ("get", "/api/auth/sesion"),
        ("get", "/api/admin/reservas?fecha=2026-10-12"),
        ("post", "/api/admin/reservas/1/cancelar"),
        ("get", "/api/admin/servicios"),
        ("post", "/api/admin/servicios"),
        ("put", "/api/admin/servicios/1"),
    ],
)
def test_las_rutas_del_panel_exigen_sesion(client, metodo, ruta):
    response = getattr(client, metodo)(ruta, json={})

    assert response.status_code == 401


# --- Comando para crear la cuenta -------------------------------------------


def test_comando_crear_admin(app):
    resultado = app.test_cli_runner().invoke(
        args=["crear-admin", "nueva@negocio.cl"],
        input="una-clave-larga\nuna-clave-larga\n",
    )

    assert resultado.exit_code == 0
    assert "creado" in resultado.output


def test_comando_crear_admin_rechaza_claves_cortas(app):
    resultado = app.test_cli_runner().invoke(
        args=["crear-admin", "nueva@negocio.cl"], input="corta\ncorta\n"
    )

    assert resultado.exit_code != 0
    assert "al menos 10 caracteres" in resultado.output


def test_comando_crear_admin_no_repite_emails(app, admin):
    resultado = app.test_cli_runner().invoke(
        args=["crear-admin", "duena@negocio.cl"],
        input="una-clave-larga\nuna-clave-larga\n",
    )

    assert resultado.exit_code != 0
    assert "Ya existe" in resultado.output
