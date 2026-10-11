from flask import Blueprint

from app.modules.servicios.schemas import ServicioOut
from app.modules.servicios.service import listar_servicios_activos

bp = Blueprint("servicios", __name__)


@bp.get("/servicios")
def listar_servicios():
    servicios = listar_servicios_activos()
    return [ServicioOut.model_validate(servicio).model_dump() for servicio in servicios]
