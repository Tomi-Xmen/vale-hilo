from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    clave: str = Field(min_length=1, max_length=200)
