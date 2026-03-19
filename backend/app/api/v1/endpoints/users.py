from fastapi import APIRouter

from app.api.deps import CurrentUserDep, UserServiceDep
from app.schemas.user import UserResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
def get_current_user_profile(current_user: CurrentUserDep, user_service: UserServiceDep) -> UserResponse:
    """Return the current authenticated user profile."""

    user = user_service.get_profile(current_user)
    return UserResponse.from_domain(user)
