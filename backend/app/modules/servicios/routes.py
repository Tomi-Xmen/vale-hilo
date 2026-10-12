from flask import Blueprint, request

from app.modules.auth.proteccion import requiere_admin
from app.modules.servicios.schemas import ServicioIn, ServicioOut
from app.modules.servicios.service import (
    actualizar_servicio,
    crear_servicio,
    listar_servicios_activos,
    listar_todos_los_servicios,
)

bp = Blueprint("servicios", __name__)


@bp.get("/servicios")
def listar_servicios():
    servicios = listar_servicios_activos()
    return [ServicioOut.model_validate(servicio).model_dump() for servicio in servicios]


# --- Panel del negocio -------------------------------------------------------


@bp.get("/admin/servicios")
@requiere_admin
def listar_servicios_admin():
    servicios = listar_todos_los_servicios()
    return [ServicioOut.model_validate(servicio).model_dump() for servicio in servicios]


@bp.post("/admin/servicios")
@requiere_admin
def crear():
    datos = ServicioIn.model_validate(request.get_json(silent=True) or {})
    servicio = crear_servicio(datos)
    return ServicioOut.model_validate(servicio).model_dump(), 201


@bp.put("/admin/servicios/<int:servicio_id>")
@requiere_admin
def editar(servicio_id):
    datos = ServicioIn.model_validate(request.get_json(silent=True) or {})
    servicio = actualizar_servicio(servicio_id, datos)
    if servicio is None:
        return {"error": "El servicio no existe"}, 404
    return ServicioOut.model_validate(servicio).model_dump()
