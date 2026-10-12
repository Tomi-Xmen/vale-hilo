from functools import wraps

from flask import g, session

from app.modules.auth.service import obtener_administrador


def requiere_admin(ruta):
    """Decorador para rutas del panel: responde 401 si no hay una sesión de administrador."""

    @wraps(ruta)
    def ruta_protegida(*args, **kwargs):
        administrador_id = session.get("administrador_id")
        administrador = obtener_administrador(administrador_id) if administrador_id else None
        if administrador is None:
            return {"error": "Tienes que iniciar sesión"}, 401

        g.administrador = administrador
        return ruta(*args, **kwargs)

    return ruta_protegida
