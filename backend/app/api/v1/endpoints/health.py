from fastapi import APIRouter

from app.schemas.common import HealthResponse


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Health check")
def health_check() -> HealthResponse:
    """Return a lightweight response for uptime monitoring."""

    return HealthResponse(status="ok", service="flexqr-backend")
