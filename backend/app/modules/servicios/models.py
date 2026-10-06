from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db

class Servicio(db.Model):
    __tablename__ = "servicios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(db.String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    precio: Mapped[int] = mapped_column(db.Integer, nullable=False)
    duracion_minutos: Mapped[int] = mapped_column(db.Integer, nullable=False)
    activo: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=True)