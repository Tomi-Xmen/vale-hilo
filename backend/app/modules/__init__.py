from app.modules.health.routes import bp as health_bp
from app.modules.servicios import models as servicios_models # noqa: F40
from app.modules.servicios.routes import bp as servicios_bp
# Cada módulo nuevo agrega acá su Blueprint; todos quedan bajo /api.
BLUEPRINTS = [health_bp, servicios_bp]


def register_blueprints(app):
    for bp in BLUEPRINTS:
        app.register_blueprint(bp, url_prefix="/api")
