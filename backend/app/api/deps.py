from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from pymongo.database import Database

from app.core.config import Settings, get_settings
from app.core.exceptions import UnauthorizedError
from app.models.user import User
from app.repositories.qrcode_access_repository import QRCodeAccessRepository
from app.repositories.qrcode_repository import QRCodeRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService
from app.services.qrcode_service import QRCodeService
from app.services.user_service import UserService


def get_database(request: Request) -> Database:
    """Expose the MongoDB database stored in the application state."""

    return request.app.state.database


def get_app_settings() -> Settings:
    """Expose the cached application settings."""

    return get_settings()


def get_user_repository(database: Database = Depends(get_database)) -> UserRepository:
    """Create a user repository for the current request."""

    return UserRepository(database)


def get_qr_code_repository(database: Database = Depends(get_database)) -> QRCodeRepository:
    """Create a QR code repository for the current request."""

    return QRCodeRepository(database)


def get_qr_code_access_repository(
    database: Database = Depends(get_database),
) -> QRCodeAccessRepository:
    """Create a QR code access repository for the current request."""

    return QRCodeAccessRepository(database)


def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository),
    settings: Settings = Depends(get_app_settings),
) -> AuthService:
    """Create the authentication service for the current request."""

    return AuthService(user_repository, settings, GoogleOAuthService(settings))


def get_user_service() -> UserService:
    """Create the user service for the current request."""

    return UserService()


def get_qr_code_service(
    qr_code_repository: QRCodeRepository = Depends(get_qr_code_repository),
    qr_code_access_repository: QRCodeAccessRepository = Depends(get_qr_code_access_repository),
) -> QRCodeService:
    """Create the QR code service for the current request."""

    return QRCodeService(qr_code_repository, qr_code_access_repository)


def get_current_user(request: Request) -> User:
    """Return the user resolved by the authentication middleware."""

    user = getattr(request.state, "current_user", None)
    if user is None:
        raise UnauthorizedError("Authentication required.")
    return user


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
QRCodeServiceDep = Annotated[QRCodeService, Depends(get_qr_code_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
