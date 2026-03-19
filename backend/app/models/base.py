from pydantic import BaseModel, ConfigDict


class DomainModel(BaseModel):
    """Base model shared by internal domain objects."""

    model_config = ConfigDict(use_enum_values=True, str_strip_whitespace=True)
