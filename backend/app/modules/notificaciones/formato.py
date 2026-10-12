"""Formatos en español para los emails, sin depender del idioma del servidor."""

DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]


def formatear_fecha_y_hora(momento):
    """Ej: "lunes 12 de octubre a las 10:00"."""
    dia = DIAS[momento.weekday()]
    mes = MESES[momento.month - 1]
    return f"{dia} {momento.day} de {mes} a las {momento:%H:%M}"


def formatear_pesos(monto):
    """Ej: "$4.500"."""
    return "$" + f"{monto:,}".replace(",", ".")
