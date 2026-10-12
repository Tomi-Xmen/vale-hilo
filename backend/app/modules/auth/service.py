from sqlalchemy import select
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.modules.auth.models import Administrador


class EmailYaRegistrado(Exception):
    pass


def crear_administrador(email, clave):
    email = _normalizar(email)
    if _buscar_por_email(email) is not None:
        raise EmailYaRegistrado()

    administrador = Administrador(email=email, clave_hash=generate_password_hash(clave))
    db.session.add(administrador)
    db.session.commit()
    return administrador


def autenticar(email, clave):
    """El administrador si el email y la clave son correctos; si no, None."""
    administrador = _buscar_por_email(_normalizar(email))
    if administrador is None or not check_password_hash(administrador.clave_hash, clave):
        return None
    return administrador


def obtener_administrador(administrador_id):
    return db.session.get(Administrador, administrador_id)


def _buscar_por_email(email):
    return db.session.scalars(select(Administrador).where(Administrador.email == email)).first()


def _normalizar(email):
    return email.strip().lower()
