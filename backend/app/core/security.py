from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt import InvalidTokenError
from pydantic import BaseModel, EmailStr

from app.core.config import Settings
from app.core.exceptions import UnauthorizedError

try:
    import bcrypt as bcrypt_lib
except ImportError:  # pragma: no cover - optional compatibility path
    bcrypt_lib = None


SCRYPT_PREFIX = "scrypt"
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64
SCRYPT_SALT_BYTES = 16


class AccessTokenPayload(BaseModel):
    """Payload stored inside FlexQR-issued JWT access tokens."""

    sub: str
    email: EmailStr
    type: str = "access"
    exp: int | None = None


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""

    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    """Hash a plain-text password using scrypt from the Python standard library."""

    password_bytes = password.encode("utf-8")
    salt = secrets.token_bytes(SCRYPT_SALT_BYTES)
    derived_key = hashlib.scrypt(
        password_bytes,
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return (
        f"{SCRYPT_PREFIX}${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}$"
        f"{_b64encode(salt)}${_b64encode(derived_key)}"
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain password matches a stored scrypt or legacy bcrypt hash."""

    if hashed_password.startswith(f"{SCRYPT_PREFIX}$"):
        return _verify_scrypt_password(plain_password, hashed_password)

    if hashed_password.startswith("$2") and bcrypt_lib is not None:
        try:
            return bcrypt_lib.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except ValueError:
            return False

    return False


def create_access_token(*, user_id: str, email: str, settings: Settings) -> tuple[str, datetime]:
    """Create a signed JWT access token for one user session."""

    expires_at = utc_now() + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at


def decode_access_token(token: str, settings: Settings) -> AccessTokenPayload:
    """Decode and validate a FlexQR-issued JWT access token."""

    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError as exc:
        raise UnauthorizedError("Invalid or expired access token.") from exc

    token_payload = AccessTokenPayload.model_validate(payload)
    if token_payload.type != "access":
        raise UnauthorizedError("Unsupported token type.")

    return token_payload


def extract_bearer_token(authorization_header: str | None) -> str | None:
    """Extract a bearer token from the Authorization header."""

    if not authorization_header:
        return None

    scheme, _, token = authorization_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise UnauthorizedError("Authorization header must use the Bearer scheme.")

    return token.strip()


def _verify_scrypt_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against the custom serialized scrypt format."""

    try:
        _, n, r, p, encoded_salt, encoded_hash = hashed_password.split("$", maxsplit=5)
        salt = _b64decode(encoded_salt)
        stored_hash = _b64decode(encoded_hash)
        derived_key = hashlib.scrypt(
            plain_password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(stored_hash),
        )
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(derived_key, stored_hash)


def _b64encode(value: bytes) -> str:
    """Serialize binary password metadata into URL-safe text."""

    return base64.urlsafe_b64encode(value).decode("ascii")


def _b64decode(value: str) -> bytes:
    """Deserialize URL-safe base64 text stored inside password hashes."""

    return base64.urlsafe_b64decode(value.encode("ascii"))
