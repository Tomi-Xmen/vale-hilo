from sqlalchemy import select

from app.extensions import db
from app.modules.servicios.models import Servicio


def listar_servicios_activos():
    consulta = select(Servicio).where(Servicio.activo).order_by(Servicio.nombre)
    return db.session.execute(consulta).scalars().all()


def obtener_servicio_activo(servicio_id):
    """El servicio con ese id, o None si no existe o ya no se ofrece."""
    servicio = db.session.get(Servicio, servicio_id)
    if servicio is None or not servicio.activo:
        return None
    return servicio


# --- Panel del negocio -------------------------------------------------------


def listar_todos_los_servicios():
    """Activos primero, después los desactivados; cada grupo por nombre."""
    consulta = select(Servicio).order_by(Servicio.activo.desc(), Servicio.nombre)
    return db.session.scalars(consulta).all()


def crear_servicio(datos):
    servicio = Servicio(**datos.model_dump())
    db.session.add(servicio)
    db.session.commit()
    return servicio


def actualizar_servicio(servicio_id, datos):
    """Guarda los cambios. Devuelve None si el servicio no existe."""
    servicio = db.session.get(Servicio, servicio_id)
    if servicio is None:
        return None

    for campo, valor in datos.model_dump().items():
        setattr(servicio, campo, valor)
    db.session.commit()
    return servicio
