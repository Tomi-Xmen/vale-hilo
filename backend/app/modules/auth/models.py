from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.modules.reservas.reglas import ahora


class Administrador(db.Model):
    """Persona que entra al panel del negocio (la dueña)."""

    __tablename__ = "administradores"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(db.String(255), unique=True)
    # Nunca se guarda la clave: solo un "hash", del que no se puede recuperar la original.
    clave_hash: Mapped[str] = mapped_column(db.String(255))
    creado_en: Mapped[datetime] = mapped_column(default=ahora)
