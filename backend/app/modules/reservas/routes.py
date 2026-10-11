from flask import Blueprint, request

from app.modules.reservas.schemas import DisponibilidadQuery, ReservaIn, ReservaOut
from app.modules.reservas.service import (
    HoraNoDisponible,
    ServicioNoEncontrado,
    calcular_horas_disponibles,
    crear_reserva,
)
from app.modules.servicios.service import obtener_servicio_activo

bp = Blueprint("reservas", __name__)


@bp.get("/disponibilidad")
def ver_disponibilidad():
    consulta = DisponibilidadQuery.model_validate(request.args.to_dict())

    servicio = obtener_servicio_activo(consulta.servicio_id)
    if servicio is None:
        return {"error": "El servicio no existe"}, 404

    horas = calcular_horas_disponibles(servicio, consulta.fecha)
    return {
        "fecha": consulta.fecha.isoformat(),
        "horas": [hora.strftime("%H:%M") for hora in horas],
    }


@bp.post("/reservas")
def reservar():
    datos = ReservaIn.model_validate(request.get_json(silent=True) or {})

    try:
        reserva = crear_reserva(datos)
    except ServicioNoEncontrado:
        return {"error": "El servicio no existe"}, 404
    except HoraNoDisponible:
        return {"error": "Esa hora ya no está disponible"}, 409

    return ReservaOut.model_validate(reserva).model_dump(mode="json"), 201
