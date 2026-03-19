from __future__ import annotations

from pymongo.errors import DuplicateKeyError

from app.core.config import Settings
from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import create_access_token, decode_access_token, hash_password, utc_now, verify_password
from app.models.auth import AuthSession
from app.models.enums import AuthProvider
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.google_oauth_service import GoogleIdentity, GoogleOAuthService


class AuthService:
    """Handles local authentication, Google authentication, and token resolution."""

    def __init__(
        self,
        user_repository: UserRepository,
        settings: Settings,
        google_oauth_service: GoogleOAuthService,
    ) -> None:
        self.user_repository = user_repository
        self.settings = settings
        self.google_oauth_service = google_oauth_service

    def register_local(self, *, name: str, email: str, password: str) -> AuthSession:
        """Register a new local account and return an authenticated session."""

        normalized_email = email.lower()
        if self.user_repository.get_by_email(normalized_email):
            raise ConflictError("A user with this email already exists.")

        now = utc_now()
        user = User(
            name=name,
            email=normalized_email,
            providers=[AuthProvider.LOCAL],
            password_hash=hash_password(password),
            is_active=True,
            created_at=now,
            updated_at=now,
            last_login_at=now,
        )

        try:
            stored_user = self.user_repository.create(user)
        except DuplicateKeyError as exc:
            raise ConflictError("A user with this email already exists.") from exc

        return self._create_session(stored_user, AuthProvider.LOCAL)

    def login_local(self, *, email: str, password: str) -> AuthSession:
        """Authenticate a local account using email and password."""

        normalized_email = email.lower()
        user = self.user_repository.get_by_email(normalized_email)
        if user is None or not user.password_hash:
            raise UnauthorizedError("Invalid email or password.")

        if not user.is_active:
            raise ForbiddenError("This account is inactive.")

        if not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        now = utc_now()
        updated_user = self.user_repository.update(
            user.id,
            {
                "last_login_at": now,
                "updated_at": now,
            },
        )
        return self._create_session(updated_user or user, AuthProvider.LOCAL)

    def authenticate_google(self, *, id_token: str) -> AuthSession:
        """Authenticate or create a Google-backed account."""

        identity = self.google_oauth_service.verify_identity_token(id_token)
        user = self._upsert_google_user(identity)
        return self._create_session(user, AuthProvider.GOOGLE)

    def resolve_bearer_token(self, token: str) -> tuple[User, str]:
        """Resolve either a FlexQR access token or a Google ID token."""

        try:
            return self._authenticate_internal_token(token), "internal"
        except UnauthorizedError as internal_error:
            if self.settings.google_client_id:
                try:
                    return self._authenticate_google_token(token), "google"
                except UnauthorizedError:
                    pass
            raise UnauthorizedError("Could not authenticate the supplied bearer token.") from internal_error

    def _authenticate_internal_token(self, token: str) -> User:
        """Authenticate one FlexQR-issued access token."""

        payload = decode_access_token(token, self.settings)
        user = self.user_repository.get_by_id(payload.sub)
        if user is None or not user.is_active:
            raise UnauthorizedError("The token subject is no longer available.")
        return user

    def _authenticate_google_token(self, token: str) -> User:
        """Authenticate one Google ID token for an already linked account."""

        identity = self.google_oauth_service.verify_identity_token(token)
        user = self.user_repository.get_by_google_sub(identity.sub)
        if user is None:
            raise UnauthorizedError("This Google account is not linked yet. Use /auth/google first.")
        if not user.is_active:
            raise UnauthorizedError("This account is inactive.")
        return user

    def _upsert_google_user(self, identity: GoogleIdentity) -> User:
        """Create or link an account based on a verified Google identity."""

        now = utc_now()
        user = self.user_repository.get_by_google_sub(identity.sub)
        if user:
            updated_user = self.user_repository.update(
                user.id,
                {
                    "last_login_at": now,
                    "updated_at": now,
                },
            )
            return updated_user or user

        existing_user = self.user_repository.get_by_email(identity.email)
        if existing_user:
            if existing_user.google_sub and existing_user.google_sub != identity.sub:
                raise ConflictError("This email is already linked to another Google account.")

            providers = sorted({*existing_user.providers, AuthProvider.GOOGLE})
            updated_user = self.user_repository.update(
                existing_user.id,
                {
                    "google_sub": identity.sub,
                    "providers": providers,
                    "last_login_at": now,
                    "updated_at": now,
                },
            )
            return updated_user or existing_user

        google_user = User(
            name=identity.name,
            email=identity.email.lower(),
            providers=[AuthProvider.GOOGLE],
            google_sub=identity.sub,
            is_active=True,
            created_at=now,
            updated_at=now,
            last_login_at=now,
        )

        try:
            return self.user_repository.create(google_user)
        except DuplicateKeyError as exc:
            raise ConflictError("A user with this email already exists.") from exc

    def _create_session(self, user: User, provider: AuthProvider) -> AuthSession:
        """Create the API session returned after a successful login."""

        access_token, expires_at = create_access_token(
            user_id=user.id,
            email=user.email,
            settings=self.settings,
        )
        return AuthSession(
            user=user,
            access_token=access_token,
            expires_at=expires_at,
            auth_provider=provider,
        )
