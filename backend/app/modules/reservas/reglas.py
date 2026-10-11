"""Reglas del negocio para reservar. Todo lo que el negocio podría querer cambiar está acá."""

from datetime import datetime, time
from zoneinfo import ZoneInfo

ZONA_HORARIA = ZoneInfo("America/Santiago")

# Horario provisorio: se ajusta cuando el negocio defina el real.
# Clave = día de la semana (0 = lunes ... 6 = domingo). Un día que no aparece está cerrado.
# Cada día acepta varios tramos, por ejemplo para dejar libre la hora de almuerzo:
#   0: [(time(10, 0), time(14, 0)), (time(15, 0), time(19, 0))]
HORARIO_ATENCION = {
    0: [(time(10, 0), time(19, 0))],
    1: [(time(10, 0), time(19, 0))],
    2: [(time(10, 0), time(19, 0))],
    3: [(time(10, 0), time(19, 0))],
    4: [(time(10, 0), time(19, 0))],
    5: [(time(10, 0), time(14, 0))],
}

# Cada cuántos minutos se ofrece una hora de inicio (10:00, 10:30, 11:00...).
INTERVALO_MINUTOS = 30

# Hasta cuántos días hacia adelante se puede reservar.
DIAS_MAXIMOS_ANTICIPACION = 60

# Porcentaje del precio que se paga como abono al reservar.
PORCENTAJE_ABONO = 30

# Minutos que la hora queda bloqueada mientras el cliente paga en Webpay.
MINUTOS_PARA_PAGAR = 10


def ahora():
    """Hora actual de Chile, sin zona horaria (igual que se guardan las reservas)."""
    return datetime.now(ZONA_HORARIA).replace(tzinfo=None)


def calcular_abono(precio):
    return round(precio * PORCENTAJE_ABONO / 100)
