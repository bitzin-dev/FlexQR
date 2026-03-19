import secrets
import string


ALPHABET = string.ascii_lowercase + string.digits


def generate_short_code(length: int = 6) -> str:
    """Generate a URL-friendly short code for a QR code."""

    return "".join(secrets.choice(ALPHABET) for _ in range(length))
