from sqlalchemy.exc import OperationalError

from app.extensions import db


def test_health_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok", "db": "ok"}


def test_health_db_error(client, monkeypatch):
    def failing_execute(*args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("db caída"))

    monkeypatch.setattr(db.session, "execute", failing_execute)

    response = client.get("/api/health")

    assert response.status_code == 503
    assert response.get_json() == {"status": "ok", "db": "error"}
