from __future__ import annotations

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import Settings
from app.core.exceptions import AppError, UnauthorizedError
from app.core.security import extract_bearer_token
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Resolve bearer tokens before requests reach protected endpoints."""

    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings

    async def dispatch(self, request: Request, call_next) -> Response:
        """Attach the authenticated user to request.state when possible."""

        request.state.current_user = None
        request.state.auth_scheme = None

        try:
            token = extract_bearer_token(request.headers.get("Authorization"))
        except UnauthorizedError as exc:
            return self._build_error_response(exc)

        if token:
            auth_service = AuthService(
                UserRepository(request.app.state.database),
                self.settings,
                GoogleOAuthService(self.settings),
            )
            try:
                user, scheme = auth_service.resolve_bearer_token(token)
            except AppError as exc:
                return self._build_error_response(exc)

            request.state.current_user = user
            request.state.auth_scheme = scheme

        return await call_next(request)

    @staticmethod
    def _build_error_response(error: AppError) -> JSONResponse:
        """Return a standardized middleware error payload."""

        payload = {
            "detail": error.detail,
            "code": error.code,
        }
        if error.extra:
            payload["extra"] = error.extra
        return JSONResponse(status_code=error.status_code, content=payload)
