from __future__ import annotations

from pydantic import EmailStr

from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token

from app.core.config import Settings
from app.core.exceptions import ConfigurationError, UnauthorizedError
from app.models.base import DomainModel


class GoogleIdentity(DomainModel):
    """Normalized Google account payload used by the auth service."""

    sub: str
    email: EmailStr
    name: str
    picture: str | None = None
    email_verified: bool = True


class GoogleOAuthService:
    """Verifies Google ID tokens using the official Google Auth SDK."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.request = GoogleRequest()

    def verify_identity_token(self, id_token: str) -> GoogleIdentity:
        """Validate a Google ID token and normalize the account payload."""

        if not self.settings.google_client_id:
            raise ConfigurationError("Google authentication is not configured yet.")

        try:
            payload = google_id_token.verify_oauth2_token(
                id_token,
                self.request,
                self.settings.google_client_id,
            )
        except ValueError as exc:
            raise UnauthorizedError("Invalid Google identity token.") from exc

        if not payload.get("email_verified"):
            raise UnauthorizedError("Google account email must be verified before login.")

        return GoogleIdentity(
            sub=payload["sub"],
            email=payload["email"],
            name=payload.get("name") or payload["email"].split("@")[0],
            picture=payload.get("picture"),
            email_verified=True,
        )
