from datetime import datetime

from app.models.base import DomainModel
from app.models.enums import AuthProvider
from app.models.user import User


class AuthSession(DomainModel):
    """Represents a completed authentication flow."""

    user: User
    access_token: str
    expires_at: datetime
    auth_provider: AuthProvider
