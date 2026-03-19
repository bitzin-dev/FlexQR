from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr

from app.models.enums import AuthProvider
from app.models.user import User
from app.schemas.base import APIModel


class UserResponse(APIModel):
    """Public representation of one FlexQR user."""

    id: str
    name: str
    email: EmailStr
    providers: list[AuthProvider]
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None = None

    @classmethod
    def from_domain(cls, user: User) -> "UserResponse":
        """Create an API response from the domain user object."""

        return cls.model_validate(user.model_dump())
