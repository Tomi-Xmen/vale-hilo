from pydantic import BaseModel, ConfigDict


class ServicioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    precio: int
    duracion_minutos: int
    activo: bool
