from app.models.user import User


class UserService:
    """Coordinates user-facing operations beyond authentication."""

    def get_profile(self, user: User) -> User:
        """Return the currently authenticated user profile."""

        return user
