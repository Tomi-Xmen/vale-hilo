import os
from datetime import timedelta

from dotenv import load_dotenv
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    # Sesión del panel: la cookie no la puede leer JavaScript (HttpOnly, por defecto en
    # Flask) y el navegador no la envía en formularios de otros sitios (SameSite=Lax).
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)

    # Dirección donde el cliente abre la app. Webpay lo devuelve acá después de pagar.
    URL_PUBLICA = os.environ.get("URL_PUBLICA", "http://localhost:5173")

    # Webpay Plus. Sin variables de entorno usa el ambiente de pruebas de Transbank,
    # con sus credenciales públicas de prueba (tarjetas falsas, sin dinero real).
    WEBPAY_AMBIENTE = os.environ.get("WEBPAY_AMBIENTE", "integracion")  # o "produccion"
    WEBPAY_CODIGO_COMERCIO = os.environ.get(
        "WEBPAY_CODIGO_COMERCIO", IntegrationCommerceCodes.WEBPAY_PLUS
    )
    WEBPAY_API_KEY = os.environ.get("WEBPAY_API_KEY", IntegrationApiKeys.WEBPAY)

    # Emails. Por defecto van a Mailpit (buzón de prueba en http://localhost:8025).
    NOMBRE_NEGOCIO = os.environ.get("NOMBRE_NEGOCIO", "vale.hilo")
    EMAIL_NEGOCIO = os.environ.get("EMAIL_NEGOCIO")  # recibe el aviso de cada reserva nueva
    MAIL_REMITENTE = os.environ.get("MAIL_REMITENTE", "vale.hilo <no-responder@vale.hilo.local>")
    MAIL_SERVIDOR = os.environ.get("MAIL_SERVIDOR", "mailpit")
    MAIL_PUERTO = int(os.environ.get("MAIL_PUERTO", "1025"))
    MAIL_USUARIO = os.environ.get("MAIL_USUARIO")
    MAIL_CLAVE = os.environ.get("MAIL_CLAVE")
    MAIL_USAR_TLS = os.environ.get("MAIL_USAR_TLS", "false").lower() == "true"
    MAIL_SUPRIMIR = False  # True: no se envía nada (lo usan los tests)


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SECRET_KEY = "clave-solo-para-tests"
    MAIL_SUPRIMIR = True
    NOMBRE_NEGOCIO = "Agenda"
    EMAIL_NEGOCIO = "duena@negocio.cl"
    # SQLite en memoria permite correr los tests sin levantar Postgres.
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", "sqlite://")


class ProductionConfig(Config):
    # En producción la app va por HTTPS: la cookie de sesión solo viaja cifrada.
    SESSION_COOKIE_SECURE = True


configs = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
