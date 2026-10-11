# Se importan los modelos para que Alembic los vea al generar migraciones.
from app.modules.health.routes import bp as health_bp
from app.modules.reservas import models as reservas_models  # noqa: F401
from app.modules.reservas.routes import bp as reservas_bp
from app.modules.servicios import models as servicios_models  # noqa: F401
from app.modules.servicios.routes import bp as servicios_bp

# Cada módulo nuevo agrega acá su Blueprint; todos quedan bajo /api.
BLUEPRINTS = [health_bp, servicios_bp, reservas_bp]


def register_blueprints(app):
    for bp in BLUEPRINTS:
        app.register_blueprint(bp, url_prefix="/api")
