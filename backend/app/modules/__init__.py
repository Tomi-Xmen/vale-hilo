from app.modules.health.routes import bp as health_bp
from app.modules.servicios import models as servicios_models

# Cada módulo nuevo agrega acá su Blueprint; todos quedan bajo /api.
BLUEPRINTS = [health_bp]


def register_blueprints(app):
    for bp in BLUEPRINTS:
        app.register_blueprint(bp, url_prefix="/api")
