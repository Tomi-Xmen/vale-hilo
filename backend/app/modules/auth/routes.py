from flask import Blueprint, g, request, session

from app.modules.auth.proteccion import requiere_admin
from app.modules.auth.schemas import LoginIn
from app.modules.auth.service import autenticar

bp = Blueprint("auth", __name__)


@bp.post("/auth/login")
def iniciar_sesion():
    datos = LoginIn.model_validate(request.get_json(silent=True) or {})

    administrador = autenticar(datos.email, datos.clave)
    if administrador is None:
        # No se dice cuál de los dos está mal, para no revelar qué emails existen.
        return {"error": "Email o clave incorrectos"}, 401

    session.clear()
    session.permanent = True  # dura lo que diga PERMANENT_SESSION_LIFETIME
    session["administrador_id"] = administrador.id
    return {"email": administrador.email}


@bp.post("/auth/logout")
def cerrar_sesion():
    session.clear()
    return {}, 204


@bp.get("/auth/sesion")
@requiere_admin
def ver_sesion():
    return {"email": g.administrador.email}
