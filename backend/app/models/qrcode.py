from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from pydantic import Field

from app.models.base import DomainModel
from app.models.enums import QRCodeActionType, QRCodeStyle, QRCodeType


class QRCodeDesign(DomainModel):
    """Defines how a QR code should look in the client."""

    fg_color: str = "#000000"
    bg_color: str = "#ffffff"
    qr_style: QRCodeStyle = QRCodeStyle.SQUARES
    eye_radius: int = 0
    eye_color: str | None = None
    logo_image: str | None = None


class WhatsAppContent(DomainModel):
    """Destination payload for WhatsApp QR codes."""

    phone: str
    message: str = ""


class QRCode(DomainModel):
    """Represents a managed QR code stored in MongoDB."""

    id: str | None = None
    owner_id: str
    name: str
    type: QRCodeType
    content: str | WhatsAppContent
    short_code: str
    clicks: int = 0
    design: QRCodeDesign = Field(default_factory=QRCodeDesign)
    edit_timestamps: list[datetime] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    last_modified: datetime
    last_accessed_at: datetime | None = None

    @classmethod
    def from_mongo(cls, document: Mapping[str, Any]) -> "QRCode":
        """Create a QRCode domain object from a MongoDB document."""

        normalized = dict(document)
        normalized["id"] = str(normalized.pop("_id"))
        normalized.setdefault("last_modified", normalized.get("updated_at"))
        return cls.model_validate(normalized)

    def to_mongo(self) -> dict[str, Any]:
        """Convert the domain object to a MongoDB document payload."""

        return self.model_dump(exclude={"id"}, exclude_none=True)


class QRCodeAccess(DomainModel):
    """Stores one public access event for analytics purposes."""

    id: str | None = None
    qr_code_id: str
    short_code: str
    ip_address: str
    user_agent: str | None = None
    action_type: QRCodeActionType
    accessed_at: datetime

    @classmethod
    def from_mongo(cls, document: Mapping[str, Any]) -> "QRCodeAccess":
        """Create an access log domain object from a MongoDB document."""

        normalized = dict(document)
        normalized["id"] = str(normalized.pop("_id"))
        return cls.model_validate(normalized)

    def to_mongo(self) -> dict[str, Any]:
        """Convert the access log to a MongoDB document payload."""

        return self.model_dump(exclude={"id"}, exclude_none=True)


class QRCodeResolutionResult(DomainModel):
    """Contains the public destination information returned after a scan."""

    qr_code: QRCode
    action_type: QRCodeActionType
    target_url: str | None = None
    copy_value: str | None = None
