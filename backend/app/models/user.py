from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from pydantic import EmailStr, Field

from app.models.base import DomainModel
from app.models.enums import AuthProvider


class User(DomainModel):
    """Represents an authenticated FlexQR account."""

    id: str | None = None
    name: str
    email: EmailStr
    providers: list[AuthProvider] = Field(default_factory=list)
    password_hash: str | None = Field(default=None, exclude=True)
    google_sub: str | None = Field(default=None, exclude=True)
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None

    @classmethod
    def from_mongo(cls, document: Mapping[str, Any]) -> "User":
        """Create a domain object from a MongoDB document."""

        normalized = dict(document)
        normalized["id"] = str(normalized.pop("_id"))
        return cls.model_validate(normalized)

    def to_mongo(self) -> dict[str, Any]:
        """Convert the domain object to a MongoDB payload."""

        payload = self.model_dump(exclude={"id"}, exclude_none=True)

        # Sensitive fields must stay out of API responses, but they still need to be
        # persisted in MongoDB for authentication and Google account linking.
        if self.password_hash is not None:
            payload["password_hash"] = self.password_hash
        if self.google_sub is not None:
            payload["google_sub"] = self.google_sub

        return payload
