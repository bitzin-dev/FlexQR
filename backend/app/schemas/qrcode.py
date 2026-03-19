from __future__ import annotations

from datetime import datetime
from urllib.parse import urlparse

from pydantic import AnyHttpUrl, Field, field_validator, model_validator

from app.models.enums import QRCodeActionType, QRCodeStyle, QRCodeType
from app.models.qrcode import QRCode, QRCodeResolutionResult
from app.schemas.base import APIModel


HEX_COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}$"
PHONE_PATTERN = r"^\+?[1-9]\d{7,15}$"


class WhatsAppContent(APIModel):
    """Destination payload for WhatsApp QR codes."""

    phone: str = Field(pattern=PHONE_PATTERN)
    message: str = Field(default="", max_length=500)


class QRCodeDesignPayload(APIModel):
    """Visual customization payload for one QR code."""

    fg_color: str = Field(default="#000000", pattern=HEX_COLOR_PATTERN)
    bg_color: str = Field(default="#ffffff", pattern=HEX_COLOR_PATTERN)
    qr_style: QRCodeStyle = QRCodeStyle.SQUARES
    eye_radius: int = Field(default=0, ge=0, le=50)
    eye_color: str | None = Field(default=None, pattern=HEX_COLOR_PATTERN)
    logo_image: AnyHttpUrl | None = None

    @field_validator("fg_color", "bg_color", "eye_color")
    @classmethod
    def normalize_color(cls, value: str | None) -> str | None:
        """Store hexadecimal colors in uppercase for consistency."""

        return value.upper() if value else value


class QRCodeCreateRequest(APIModel):
    """Payload used to create a QR code."""

    name: str = Field(min_length=1, max_length=100)
    type: QRCodeType
    content: str | WhatsAppContent
    design: QRCodeDesignPayload = Field(default_factory=QRCodeDesignPayload)

    @model_validator(mode="after")
    def validate_payload(self) -> "QRCodeCreateRequest":
        """Ensure the destination matches the selected QR code type."""

        if self.type == QRCodeType.WHATSAPP:
            if not isinstance(self.content, WhatsAppContent):
                raise ValueError("WhatsApp QR codes require a phone and an optional message.")
            return self

        if not isinstance(self.content, str):
            raise ValueError("URL and Pix QR codes require string content.")

        if self.type == QRCodeType.URL:
            parsed = urlparse(self.content)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("URL QR codes require a valid HTTP or HTTPS destination.")

        return self


class QRCodeUpdateRequest(APIModel):
    """Payload used to update a QR code."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: QRCodeType | None = None
    content: str | WhatsAppContent | None = None
    design: QRCodeDesignPayload | None = None


class QRCodeResponse(APIModel):
    """Private representation of a QR code returned to its owner."""

    id: str
    owner_id: str
    name: str
    type: QRCodeType
    content: str | WhatsAppContent
    short_code: str
    clicks: int
    design: QRCodeDesignPayload
    edit_timestamps: list[datetime]
    created_at: datetime
    updated_at: datetime
    last_modified: datetime
    last_accessed_at: datetime | None = None

    @classmethod
    def from_domain(cls, qr_code: QRCode) -> "QRCodeResponse":
        """Create an owner-facing response from the domain QR code."""

        return cls.model_validate(qr_code.model_dump())


class QRCodePublicResponse(APIModel):
    """Public representation of a QR code fetched by short code."""

    id: str
    name: str
    type: QRCodeType
    short_code: str
    clicks: int
    design: QRCodeDesignPayload
    created_at: datetime
    updated_at: datetime
    last_modified: datetime

    @classmethod
    def from_domain(cls, qr_code: QRCode) -> "QRCodePublicResponse":
        """Create a public response from the domain QR code."""

        payload = qr_code.model_dump()
        allowed_keys = {
            "id",
            "name",
            "type",
            "short_code",
            "clicks",
            "design",
            "created_at",
            "updated_at",
            "last_modified",
        }
        return cls.model_validate({key: payload[key] for key in allowed_keys})


class QRCodeAccessResponse(APIModel):
    """Response returned after one public QR code access is registered."""

    qr_code: QRCodePublicResponse
    action_type: QRCodeActionType
    target_url: str | None = None
    copy_value: str | None = None

    @classmethod
    def from_domain(cls, result: QRCodeResolutionResult) -> "QRCodeAccessResponse":
        """Create a public access response from a resolution result."""

        return cls(
            qr_code=QRCodePublicResponse.from_domain(result.qr_code),
            action_type=result.action_type,
            target_url=result.target_url,
            copy_value=result.copy_value,
        )
