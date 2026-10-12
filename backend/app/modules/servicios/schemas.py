from pydantic import BaseModel, ConfigDict, Field, field_validator


class ServicioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    precio: int
    duracion_minutos: int
    activo: bool


class ServicioIn(BaseModel):
    """Datos que la dueña ingresa al crear o editar un servicio."""

    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio: int = Field(gt=0, le=10_000_000)
    duracion_minutos: int = Field(ge=5, le=480)
    activo: bool = True

    @field_validator("descripcion")
    @classmethod
    def vacia_es_sin_descripcion(cls, descripcion):
        return descripcion or None
