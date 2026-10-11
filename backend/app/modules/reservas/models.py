from datetime import datetime
from enum import StrEnum

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.modules.reservas.reglas import ahora


class EstadoReserva(StrEnum):
    PENDIENTE_PAGO = "pendiente_pago"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"


class Reserva(db.Model):
    __tablename__ = "reservas"

    id: Mapped[int] = mapped_column(primary_key=True)
    servicio_id: Mapped[int] = mapped_column(ForeignKey("servicios.id"))
    cliente_nombre: Mapped[str] = mapped_column(db.String(100))
    cliente_email: Mapped[str] = mapped_column(db.String(255))
    cliente_telefono: Mapped[str] = mapped_column(db.String(20))
    # Todas las fechas se guardan en hora de Chile, sin zona horaria.
    inicio: Mapped[datetime] = mapped_column(index=True)
    fin: Mapped[datetime]
    estado: Mapped[str] = mapped_column(db.String(20), default=EstadoReserva.PENDIENTE_PAGO)
    # Se guarda el monto al reservar: si después cambia el precio, la reserva no cambia.
    monto_abono: Mapped[int]
    # Hasta cuándo se bloquea la hora mientras el cliente paga. Solo aplica a pendientes.
    expira_en: Mapped[datetime | None]
    creada_en: Mapped[datetime] = mapped_column(default=ahora)

    servicio = relationship("Servicio")

    @property
    def servicio_nombre(self):
        return self.servicio.nombre
