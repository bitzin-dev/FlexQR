from app.schemas.base import APIModel


class HealthResponse(APIModel):
    """Simple health response exposed by the backend."""

    status: str
    service: str


class ErrorResponse(APIModel):
    """Standard error payload returned by the application."""

    detail: str
    code: str
