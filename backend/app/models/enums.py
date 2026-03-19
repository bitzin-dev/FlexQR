from enum import Enum


class AuthProvider(str, Enum):
    """Authentication strategies supported by the platform."""

    LOCAL = "local"
    GOOGLE = "google"


class QRCodeType(str, Enum):
    """Supported QR code destinations."""

    URL = "url"
    WHATSAPP = "whatsapp"
    PIX = "pix"


class QRCodeStyle(str, Enum):
    """Supported rendering styles for the QR code preview."""

    SQUARES = "squares"
    DOTS = "dots"


class QRCodeActionType(str, Enum):
    """Client actions returned by public QR code access endpoints."""

    REDIRECT = "redirect"
    COPY = "copy"
