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
