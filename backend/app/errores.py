from pydantic import ValidationError


def registrar_manejadores_de_errores(app):
    @app.errorhandler(ValidationError)
    def datos_invalidos(error):
        # Cualquier ruta que valide con Pydantic responde 400 con el detalle por campo.
        detalles = error.errors(include_url=False, include_context=False, include_input=False)
        return {"error": "Datos inválidos", "detalles": detalles}, 400
