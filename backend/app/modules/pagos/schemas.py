from pydantic import BaseModel


class PagoIn(BaseModel):
    reserva_id: int
