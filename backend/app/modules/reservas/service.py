from datetime import datetime, timedelta

from sqlalchemy import and_, or_, select, text

from app.extensions import db
from app.modules.reservas.models import EstadoReserva, Reserva
from app.modules.reservas.reglas import (
    DIAS_MAXIMOS_ANTICIPACION,
    HORARIO_ATENCION,
    INTERVALO_MINUTOS,
    MINUTOS_PARA_PAGAR,
    ahora,
    calcular_abono,
)
from app.modules.servicios.service import obtener_servicio_activo

# Número arbitrario que identifica el candado de la agenda en Postgres.
CANDADO_AGENDA = 1


class ServicioNoEncontrado(Exception):
    pass


class HoraNoDisponible(Exception):
    pass


def calcular_horas_disponibles(servicio, fecha):
    """Horas de inicio libres para el servicio en esa fecha, en orden."""
    if not _es_fecha_reservable(fecha):
        return []

    duracion = timedelta(minutes=servicio.duracion_minutos)
    intervalo = timedelta(minutes=INTERVALO_MINUTOS)
    momento_actual = ahora()
    reservas_del_dia = _reservas_que_ocupan(
        desde=datetime.combine(fecha, datetime.min.time()),
        hasta=datetime.combine(fecha, datetime.max.time()),
    )

    horas_libres = []
    for apertura, cierre in HORARIO_ATENCION.get(fecha.weekday(), []):
        inicio = datetime.combine(fecha, apertura)
        ultimo_inicio_posible = datetime.combine(fecha, cierre) - duracion

        while inicio <= ultimo_inicio_posible:
            fin = inicio + duracion
            if inicio > momento_actual and not _se_cruza(inicio, fin, reservas_del_dia):
                horas_libres.append(inicio)
            inicio += intervalo

    return horas_libres


def crear_reserva(datos):
    """Crea una reserva pendiente de pago que bloquea la hora por unos minutos."""
    servicio = obtener_servicio_activo(datos.servicio_id)
    if servicio is None:
        raise ServicioNoEncontrado()

    # Evita que dos clientes tomen la misma hora al mismo tiempo: el segundo
    # espera acá hasta que el primero termine, y después ve su reserva.
    _bloquear_agenda()

    if datos.inicio not in calcular_horas_disponibles(servicio, datos.inicio.date()):
        raise HoraNoDisponible()

    reserva = Reserva(
        servicio_id=servicio.id,
        cliente_nombre=datos.cliente_nombre,
        cliente_email=datos.cliente_email,
        cliente_telefono=datos.cliente_telefono,
        inicio=datos.inicio,
        fin=datos.inicio + timedelta(minutes=servicio.duracion_minutos),
        estado=EstadoReserva.PENDIENTE_PAGO,
        monto_abono=calcular_abono(servicio.precio),
        expira_en=ahora() + timedelta(minutes=MINUTOS_PARA_PAGAR),
    )
    db.session.add(reserva)
    db.session.commit()
    return reserva


def _es_fecha_reservable(fecha):
    hoy = ahora().date()
    return hoy <= fecha <= hoy + timedelta(days=DIAS_MAXIMOS_ANTICIPACION)


def _reservas_que_ocupan(desde, hasta):
    """Reservas que ocupan la agenda en algún momento entre `desde` y `hasta`.

    Ocupan la agenda las confirmadas y las pendientes de pago que todavía no expiran.
    """
    sigue_bloqueando = or_(
        Reserva.estado == EstadoReserva.CONFIRMADA,
        and_(Reserva.estado == EstadoReserva.PENDIENTE_PAGO, Reserva.expira_en > ahora()),
    )
    consulta = select(Reserva).where(
        Reserva.inicio < hasta,
        Reserva.fin > desde,
        sigue_bloqueando,
    )
    return db.session.scalars(consulta).all()


def _se_cruza(inicio, fin, reservas):
    # Dos horarios se cruzan si cada uno empieza antes de que termine el otro.
    # Una reserva que termina a las 11:00 no se cruza con otra que empieza a las 11:00.
    return any(inicio < reserva.fin and reserva.inicio < fin for reserva in reservas)


def _bloquear_agenda():
    # El candado se suelta solo al hacer commit. SQLite (tests) no lo necesita.
    if db.engine.dialect.name == "postgresql":
        db.session.execute(text("SELECT pg_advisory_xact_lock(:id)"), {"id": CANDADO_AGENDA})
