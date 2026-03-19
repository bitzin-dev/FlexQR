from fastapi import APIRouter, status

from app.api.deps import AuthServiceDep
from app.schemas.auth import AuthResponse, GoogleAuthRequest, LoginRequest, RegisterRequest


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register with email and password",
)
def register(payload: RegisterRequest, auth_service: AuthServiceDep) -> AuthResponse:
    """Create a local account and return the authenticated session."""

    session = auth_service.register_local(
        name=payload.name,
        email=payload.email,
        password=payload.password,
    )
    return AuthResponse.from_domain(session)


@router.post("/login", response_model=AuthResponse, summary="Login with email and password")
def login(payload: LoginRequest, auth_service: AuthServiceDep) -> AuthResponse:
    """Authenticate a local account and return the authenticated session."""

    session = auth_service.login_local(email=payload.email, password=payload.password)
    return AuthResponse.from_domain(session)


@router.post("/google", response_model=AuthResponse, summary="Login or register with Google")
def google_auth(payload: GoogleAuthRequest, auth_service: AuthServiceDep) -> AuthResponse:
    """Authenticate or create an account using a Google ID token."""

    session = auth_service.authenticate_google(id_token=payload.id_token)
    return AuthResponse.from_domain(session)
