import os

from flask import Flask

from app.config import configs
from app.extensions import db, migrate
from app.modules.health.routes import bp as health_bp


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(configs[config_name])

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(health_bp, url_prefix="/api")

    return app
