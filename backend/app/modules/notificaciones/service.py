from flask import current_app, render_template

from app.modules.notificaciones.correo import enviar_correo
from app.modules.notificaciones.formato import formatear_fecha_y_hora, formatear_pesos


def avisar_reserva_confirmada(reserva):
    """Al cliente: su reserva quedó confirmada. Al negocio: llegó una reserva nueva."""
    datos = _datos_de_la_reserva(reserva)

    _enviar(
        para=reserva.cliente_email,
        asunto=f"Tu reserva está confirmada: {datos['cuando']}",
        plantilla="reserva_confirmada",
        datos=datos,
    )

    email_negocio = current_app.config["EMAIL_NEGOCIO"]
    if email_negocio:
        _enviar(
            para=email_negocio,
            asunto=f"Nueva reserva: {datos['servicio']}, {datos['cuando']}",
            plantilla="nueva_reserva_para_el_negocio",
            datos=datos,
        )


def avisar_reserva_cancelada(reserva, abono_devuelto):
    """Al cliente: el negocio canceló su reserva (y si se le devolvió el abono)."""
    datos = _datos_de_la_reserva(reserva) | {"abono_devuelto": abono_devuelto}
    _enviar(
        para=reserva.cliente_email,
        asunto=f"Tu reserva del {datos['cuando']} fue cancelada",
        plantilla="reserva_cancelada",
        datos=datos,
    )


def _enviar(para, asunto, plantilla, datos):
    # Cada email tiene dos versiones: texto simple y HTML (el programa de correo elige).
    texto = render_template(f"correos/{plantilla}.txt", **datos)
    html = render_template(f"correos/{plantilla}.html", **datos)
    enviar_correo(para, asunto, texto, html)


def _datos_de_la_reserva(reserva):
    config = current_app.config
    return {
        "nombre_negocio": config["NOMBRE_NEGOCIO"],
        "cliente_nombre": reserva.cliente_nombre,
        "cliente_email": reserva.cliente_email,
        "cliente_telefono": reserva.cliente_telefono,
        "servicio": reserva.servicio_nombre,
        "cuando": formatear_fecha_y_hora(reserva.inicio),
        "abono": formatear_pesos(reserva.monto_abono),
        "url_reserva": f"{config['URL_PUBLICA']}/reservas/{reserva.id}",
    }
