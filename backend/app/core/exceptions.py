from __future__ import annotations

from typing import Any


class AppError(Exception):
    """Base exception used across repositories, services, and middleware."""

    status_code = 400
    code = "application_error"

    def __init__(self, detail: str, *, extra: dict[str, Any] | None = None) -> None:
        super().__init__(detail)
        self.detail = detail
        self.extra = extra or {}


class ValidationError(AppError):
    """Raised when request or business validation fails."""

    status_code = 422
    code = "validation_error"


class UnauthorizedError(AppError):
    """Raised when a request cannot be authenticated."""

    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppError):
    """Raised when a user tries to access someone else's resource."""

    status_code = 403
    code = "forbidden"


class NotFoundError(AppError):
    """Raised when a requested entity does not exist."""

    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    """Raised when a request conflicts with current application state."""

    status_code = 409
    code = "conflict"


class RateLimitError(AppError):
    """Raised when a business rate limit is exceeded."""

    status_code = 429
    code = "rate_limited"


class ConfigurationError(AppError):
    """Raised when a required environment setting is missing or invalid."""

    status_code = 500
    code = "configuration_error"
