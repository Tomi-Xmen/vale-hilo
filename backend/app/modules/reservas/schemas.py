from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.modules.reservas.reglas import ZONA_HORARIA


class DisponibilidadQuery(BaseModel):
    servicio_id: int
    fecha: date


class ReservaIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    servicio_id: int
    inicio: datetime
    cliente_nombre: str = Field(min_length=2, max_length=100)
    cliente_email: EmailStr
    cliente_telefono: str = Field(min_length=8, max_length=20)

    @field_validator("inicio")
    @classmethod
    def pasar_a_hora_de_chile(cls, inicio):
        # Si el frontend manda la hora con zona horaria (ej. "...Z"), se convierte a la de Chile.
        if inicio.tzinfo is None:
            return inicio
        return inicio.astimezone(ZONA_HORARIA).replace(tzinfo=None)


class ReservaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    servicio_id: int
    cliente_nombre: str
    inicio: datetime
    fin: datetime
    estado: str
    monto_abono: int
    expira_en: datetime | None
