from datetime import datetime
from enum import StrEnum

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.modules.reservas.reglas import ahora


class EstadoPago(StrEnum):
    INICIADO = "iniciado"  # el cliente está en Webpay
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"  # tarjeta rechazada, cliente canceló o se acabó el tiempo
    REEMBOLSADO = "reembolsado"  # se pagó, pero la hora ya no estaba y se devolvió el dinero


class Pago(db.Model):
    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Una reserva puede tener varios pagos: si el primero se rechaza, el cliente reintenta.
    reserva_id: Mapped[int] = mapped_column(ForeignKey("reservas.id"), index=True)
    monto: Mapped[int]
    estado: Mapped[str] = mapped_column(db.String(20), default=EstadoPago.INICIADO)
    token: Mapped[str | None] = mapped_column(db.String(64), unique=True)
    codigo_autorizacion: Mapped[str | None] = mapped_column(db.String(20))
    ultimos_digitos_tarjeta: Mapped[str | None] = mapped_column(db.String(4))
    creado_en: Mapped[datetime] = mapped_column(default=ahora)

    @property
    def orden_compra(self):
        # Identificador que ve Transbank. Máximo 26 caracteres, ej: "R15-P23".
        return f"R{self.reserva_id}-P{self.id}"
