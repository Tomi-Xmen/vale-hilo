from flask import Blueprint, request

from app.modules.auth.proteccion import requiere_admin
from app.modules.notificaciones.service import avisar_reserva_cancelada
from app.modules.pagos.service import SinPagoQueDevolver, devolver_abono
from app.modules.pagos.webpay import ErrorWebpay
from app.modules.reservas.models import EstadoReserva
from app.modules.reservas.reglas import calcular_abono
from app.modules.reservas.schemas import (
    AgendaQuery,
    CancelacionIn,
    DisponibilidadQuery,
    ReservaAdminOut,
    ReservaIn,
    ReservaOut,
)
from app.modules.reservas.service import (
    HoraNoDisponible,
    ServicioNoEncontrado,
    calcular_horas_disponibles,
    cancelar_reserva,
    crear_reserva,
    esta_esperando_pago,
    listar_reservas_del_dia,
    obtener_reserva,
    se_puede_cancelar,
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
        "monto_abono": calcular_abono(servicio.precio),
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

    return _reserva_como_json(reserva), 201


@bp.get("/reservas/<int:reserva_id>")
def ver_reserva(reserva_id):
    reserva = obtener_reserva(reserva_id)
    if reserva is None:
        return {"error": "La reserva no existe"}, 404
    return _reserva_como_json(reserva)


def _reserva_como_json(reserva):
    datos = ReservaOut.model_validate(reserva).model_dump(mode="json")
    # Le dice al frontend si todavía puede mandar al cliente a pagar.
    datos["puede_pagar"] = esta_esperando_pago(reserva)
    return datos


# --- Panel del negocio -------------------------------------------------------


@bp.get("/admin/reservas")
@requiere_admin
def ver_agenda():
    consulta = AgendaQuery.model_validate(request.args.to_dict())
    reservas = listar_reservas_del_dia(consulta.fecha)
    return [ReservaAdminOut.model_validate(r).model_dump(mode="json") for r in reservas]


@bp.post("/admin/reservas/<int:reserva_id>/cancelar")
@requiere_admin
def cancelar(reserva_id):
    datos = CancelacionIn.model_validate(request.get_json(silent=True) or {})

    reserva = obtener_reserva(reserva_id)
    if reserva is None:
        return {"error": "La reserva no existe"}, 404
    if not se_puede_cancelar(reserva):
        return {"error": "La reserva ya estaba cancelada"}, 409

    # Primero se devuelve el dinero: si Webpay falla, la reserva sigue vigente y se
    # puede reintentar, en vez de quedar cancelada con el abono sin devolver.
    if datos.devolver_abono:
        try:
            devolver_abono(reserva.id)
        except SinPagoQueDevolver:
            return {"error": "Esta reserva no tiene un abono pagado para devolver"}, 409
        except ErrorWebpay:
            return {"error": "Webpay no pudo devolver el abono. La reserva no se canceló."}, 502

    # Solo se avisa si estaba confirmada: si estaba "pagando", el cliente nunca pagó.
    estaba_confirmada = reserva.estado == EstadoReserva.CONFIRMADA
    cancelar_reserva(reserva)
    if estaba_confirmada:
        avisar_reserva_cancelada(reserva, abono_devuelto=datos.devolver_abono)

    return ReservaAdminOut.model_validate(reserva).model_dump(mode="json")
