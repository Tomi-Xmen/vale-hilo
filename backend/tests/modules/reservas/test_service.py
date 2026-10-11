from datetime import date, datetime, time, timedelta

import pytest

from app.modules.reservas.models import EstadoReserva
from app.modules.reservas.schemas import ReservaIn
from app.modules.reservas.service import (
    HoraNoDisponible,
    ServicioNoEncontrado,
    calcular_horas_disponibles,
    crear_reserva,
)

LUNES = date(2026, 10, 12)
SABADO = date(2026, 10, 17)
DOMINGO = date(2026, 10, 18)


def el_lunes_a_las(texto):
    return datetime.combine(LUNES, time.fromisoformat(texto))


def como_texto(horas):
    return [hora.strftime("%H:%M") for hora in horas]


def datos_reserva(servicio, inicio):
    return ReservaIn(
        servicio_id=servicio.id,
        inicio=inicio,
        cliente_nombre="Ana Pérez",
        cliente_email="ana@correo.cl",
        cliente_telefono="+56912345678",
    )


# --- Horas disponibles -------------------------------------------------------


def test_ofrece_horas_cada_30_minutos_dentro_del_horario(crear_servicio):
    servicio = crear_servicio(duracion_minutos=60)

    horas = como_texto(calcular_horas_disponibles(servicio, LUNES))

    assert horas[:3] == ["10:00", "10:30", "11:00"]
    assert horas[-1] == "18:00"  # termina 19:00, justo al cierre
    assert len(horas) == 17


def test_el_servicio_no_puede_terminar_despues_del_cierre(crear_servicio):
    servicio = crear_servicio(duracion_minutos=45)

    assert como_texto(calcular_horas_disponibles(servicio, LUNES))[-1] == "18:00"
    assert como_texto(calcular_horas_disponibles(servicio, SABADO))[-1] == "13:00"


def test_dia_cerrado_no_tiene_horas(crear_servicio):
    servicio = crear_servicio()

    assert calcular_horas_disponibles(servicio, DOMINGO) == []


def test_reserva_confirmada_bloquea_las_horas_que_se_cruzan(crear_servicio, crear_reserva_en_bd):
    servicio = crear_servicio(duracion_minutos=60)
    crear_reserva_en_bd(
        servicio,
        inicio=el_lunes_a_las("11:00"),
        fin=el_lunes_a_las("12:00"),
        estado=EstadoReserva.CONFIRMADA,
    )

    horas = como_texto(calcular_horas_disponibles(servicio, LUNES))

    assert "10:00" in horas  # termina 11:00, justo cuando empieza la otra
    assert "10:30" not in horas
    assert "11:00" not in horas
    assert "11:30" not in horas
    assert "12:00" in horas  # empieza justo cuando termina la otra


def test_reserva_pendiente_bloquea_mientras_no_expira(crear_servicio, crear_reserva_en_bd):
    servicio = crear_servicio()
    crear_reserva_en_bd(
        servicio,
        inicio=el_lunes_a_las("10:00"),
        fin=el_lunes_a_las("11:00"),
        estado=EstadoReserva.PENDIENTE_PAGO,
        expira_en=datetime(2026, 10, 11, 20, 5),  # 5 minutos después de "ahora"
    )

    assert "10:00" not in como_texto(calcular_horas_disponibles(servicio, LUNES))


def test_reserva_pendiente_expirada_libera_la_hora(crear_servicio, crear_reserva_en_bd):
    servicio = crear_servicio()
    crear_reserva_en_bd(
        servicio,
        inicio=el_lunes_a_las("10:00"),
        fin=el_lunes_a_las("11:00"),
        estado=EstadoReserva.PENDIENTE_PAGO,
        expira_en=datetime(2026, 10, 11, 19, 55),  # expiró hace 5 minutos
    )

    assert "10:00" in como_texto(calcular_horas_disponibles(servicio, LUNES))


def test_reserva_cancelada_no_bloquea(crear_servicio, crear_reserva_en_bd):
    servicio = crear_servicio()
    crear_reserva_en_bd(
        servicio,
        inicio=el_lunes_a_las("10:00"),
        fin=el_lunes_a_las("11:00"),
        estado=EstadoReserva.CANCELADA,
    )

    assert "10:00" in como_texto(calcular_horas_disponibles(servicio, LUNES))


def test_hoy_solo_ofrece_horas_que_no_han_pasado(crear_servicio, fijar_hora):
    servicio = crear_servicio()
    fijar_hora(el_lunes_a_las("12:10"))

    assert como_texto(calcular_horas_disponibles(servicio, LUNES))[0] == "12:30"


def test_no_ofrece_fechas_pasadas_ni_muy_lejanas(crear_servicio):
    servicio = crear_servicio()
    lunes_pasado = LUNES - timedelta(days=7)
    lunes_en_9_semanas = LUNES + timedelta(weeks=9)  # más de 60 días

    assert calcular_horas_disponibles(servicio, lunes_pasado) == []
    assert calcular_horas_disponibles(servicio, lunes_en_9_semanas) == []


# --- Crear reserva -----------------------------------------------------------


def test_crear_reserva_queda_pendiente_de_pago(crear_servicio):
    servicio = crear_servicio(precio=15000, duracion_minutos=45)

    reserva = crear_reserva(datos_reserva(servicio, el_lunes_a_las("10:00")))

    assert reserva.estado == EstadoReserva.PENDIENTE_PAGO
    assert reserva.fin == el_lunes_a_las("10:45")
    assert reserva.monto_abono == 4500  # 30% de 15.000
    assert reserva.expira_en == datetime(2026, 10, 11, 20, 10)  # "ahora" + 10 minutos


def test_no_se_puede_reservar_una_hora_ya_tomada(crear_servicio):
    servicio = crear_servicio()
    crear_reserva(datos_reserva(servicio, el_lunes_a_las("10:00")))

    with pytest.raises(HoraNoDisponible):
        crear_reserva(datos_reserva(servicio, el_lunes_a_las("10:30")))


def test_no_se_puede_reservar_fuera_de_los_intervalos(crear_servicio):
    servicio = crear_servicio()

    with pytest.raises(HoraNoDisponible):
        crear_reserva(datos_reserva(servicio, el_lunes_a_las("10:15")))


def test_no_se_puede_reservar_un_servicio_inactivo(crear_servicio):
    servicio = crear_servicio(activo=False)

    with pytest.raises(ServicioNoEncontrado):
        crear_reserva(datos_reserva(servicio, el_lunes_a_las("10:00")))
