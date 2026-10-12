"""Único archivo que sabe cómo se envían los emails (por SMTP).

En desarrollo van a Mailpit (http://localhost:8025) y nunca salen a internet. En producción
basta con configurar el servidor SMTP de un servicio de correo real.
"""

import smtplib
from email.message import EmailMessage

from flask import current_app


def enviar_correo(para, asunto, texto, html):
    """Envía un email. Si falla, lo registra y sigue: un email nunca debe romper una reserva."""
    config = current_app.config

    mensaje = EmailMessage()
    mensaje["From"] = config["MAIL_REMITENTE"]
    mensaje["To"] = para
    mensaje["Subject"] = asunto
    if config["EMAIL_NEGOCIO"]:
        # Si el cliente responde el email, la respuesta le llega al negocio.
        mensaje["Reply-To"] = config["EMAIL_NEGOCIO"]
    mensaje.set_content(texto)
    mensaje.add_alternative(html, subtype="html")

    if config["MAIL_SUPRIMIR"]:
        # En los tests no se envía nada: se guarda para poder revisarlo.
        current_app.extensions.setdefault("correos_enviados", []).append(mensaje)
        return

    try:
        with smtplib.SMTP(config["MAIL_SERVIDOR"], config["MAIL_PUERTO"], timeout=10) as smtp:
            if config["MAIL_USAR_TLS"]:
                smtp.starttls()
            if config["MAIL_USUARIO"]:
                smtp.login(config["MAIL_USUARIO"], config["MAIL_CLAVE"])
            smtp.send_message(mensaje)
    except (smtplib.SMTPException, OSError):
        current_app.logger.exception("No se pudo enviar el email '%s' a %s", asunto, para)
