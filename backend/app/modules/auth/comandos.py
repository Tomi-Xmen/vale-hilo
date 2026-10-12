import click
from flask.cli import with_appcontext

from app.modules.auth.service import EmailYaRegistrado, crear_administrador

LARGO_MINIMO_CLAVE = 10


@click.command("crear-admin")
@click.argument("email")
@click.password_option("--clave", prompt="Clave", confirmation_prompt="Repite la clave")
@with_appcontext
def crear_admin(email, clave):
    """Crea la cuenta para entrar al panel. Uso: flask crear-admin correo@negocio.cl"""
    if len(clave) < LARGO_MINIMO_CLAVE:
        raise click.ClickException(f"La clave debe tener al menos {LARGO_MINIMO_CLAVE} caracteres")

    try:
        crear_administrador(email, clave)
    except EmailYaRegistrado as error:
        raise click.ClickException(f"Ya existe un administrador con el email {email}") from error

    click.echo(f"Administrador {email} creado.")
