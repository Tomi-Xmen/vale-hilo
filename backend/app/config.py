import os

from dotenv import load_dotenv
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    # Dirección donde el cliente abre la app. Webpay lo devuelve acá después de pagar.
    URL_PUBLICA = os.environ.get("URL_PUBLICA", "http://localhost:5173")

    # Webpay Plus. Sin variables de entorno usa el ambiente de pruebas de Transbank,
    # con sus credenciales públicas de prueba (tarjetas falsas, sin dinero real).
    WEBPAY_AMBIENTE = os.environ.get("WEBPAY_AMBIENTE", "integracion")  # o "produccion"
    WEBPAY_CODIGO_COMERCIO = os.environ.get(
        "WEBPAY_CODIGO_COMERCIO", IntegrationCommerceCodes.WEBPAY_PLUS
    )
    WEBPAY_API_KEY = os.environ.get("WEBPAY_API_KEY", IntegrationApiKeys.WEBPAY)


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    # SQLite en memoria permite correr los tests sin levantar Postgres.
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", "sqlite://")


class ProductionConfig(Config):
    pass


configs = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
