from __future__ import annotations

from datetime import datetime
import re

from pydantic import EmailStr, Field, field_validator

from app.models.auth import AuthSession
from app.models.enums import AuthProvider
from app.schemas.base import APIModel
from app.schemas.user import UserResponse


PASSWORD_SPECIAL_CHARACTER_PATTERN = re.compile(r"[^A-Za-z0-9]")


class RegisterRequest(APIModel):
    """Payload used to create a local account."""

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """Require a strong password for local accounts."""

        if not any(character.islower() for character in value):
            raise ValueError("Password must include at least one lowercase letter.")
        if not any(character.isupper() for character in value):
            raise ValueError("Password must include at least one uppercase letter.")
        if not any(character.isdigit() for character in value):
            raise ValueError("Password must include at least one number.")
        if not PASSWORD_SPECIAL_CHARACTER_PATTERN.search(value):
            raise ValueError("Password must include at least one special character.")
        return value


class LoginRequest(APIModel):
    """Payload used to authenticate with email and password."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class GoogleAuthRequest(APIModel):
    """Payload used to authenticate with a Google ID token."""

    id_token: str = Field(min_length=20)


class TokenResponse(APIModel):
    """Response containing one access token."""

    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class AuthResponse(APIModel):
    """Response returned after any successful authentication flow."""

    user: UserResponse
    token: TokenResponse
    auth_provider: AuthProvider

    @classmethod
    def from_domain(cls, session: AuthSession) -> "AuthResponse":
        """Create an API response from an internal auth session."""

        return cls(
            user=UserResponse.from_domain(session.user),
            token=TokenResponse(
                access_token=session.access_token,
                expires_at=session.expires_at,
            ),
            auth_provider=session.auth_provider,
        )
