import pytest

from app import create_app
from app.extensions import db
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
def crear_servicio(app):
    """Crea un servicio en la base de datos. Se pueden cambiar los valores por defecto."""

    def _crear(**datos):
        valores = {"nombre": "Corte", "precio": 15000, "duracion_minutos": 60} | datos
        servicio = Servicio(**valores)
        db.session.add(servicio)
        db.session.commit()
        return servicio

    return _crear
