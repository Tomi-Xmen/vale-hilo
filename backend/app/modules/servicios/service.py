from sqlalchemy import select

from app.extensions import db
from app.modules.servicios.models import Servicio


def listar_servicios_activos():
    consulta = select(Servicio).where(Servicio.activo).order_by(Servicio.nombre)
    return db.session.execute(consulta).scalars().all()