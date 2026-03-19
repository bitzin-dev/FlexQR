from __future__ import annotations

from urllib.parse import quote

from pydantic import ValidationError as PydanticValidationError
from pymongo.errors import DuplicateKeyError

from app.core.constants import (
    DEFAULT_SHORT_CODE_LENGTH,
    MAX_QR_CODES_PER_ACCOUNT,
    MAX_QR_CODE_EDITS_PER_MINUTE,
)
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, RateLimitError, ValidationError
from app.core.security import utc_now
from app.models.enums import QRCodeActionType, QRCodeType
from app.models.qrcode import QRCode, QRCodeAccess, QRCodeResolutionResult, WhatsAppContent
from app.repositories.qrcode_access_repository import QRCodeAccessRepository
from app.repositories.qrcode_repository import QRCodeRepository
from app.schemas.qrcode import QRCodeCreateRequest, QRCodeUpdateRequest
from app.utils.datetime import filter_recent_timestamps
from app.utils.shortcodes import generate_short_code


class QRCodeService:
    """Applies business rules for QR code CRUD and public access."""

    def __init__(
        self,
        qr_code_repository: QRCodeRepository,
        qr_code_access_repository: QRCodeAccessRepository,
    ) -> None:
        self.qr_code_repository = qr_code_repository
        self.qr_code_access_repository = qr_code_access_repository

    def list_by_owner(self, owner_id: str) -> list[QRCode]:
        """Return all QR codes that belong to one account."""

        return self.qr_code_repository.list_by_owner(owner_id)

    def get_owned_qr_code(self, owner_id: str, qr_code_id: str) -> QRCode:
        """Return one QR code and ensure the caller owns it."""

        qr_code = self.qr_code_repository.get_by_id(qr_code_id)
        if qr_code is None:
            raise NotFoundError("QR code not found.")
        if qr_code.owner_id != owner_id:
            raise ForbiddenError("You do not own this QR code.")
        return qr_code

    def get_by_short_code(self, short_code: str) -> QRCode:
        """Return one public QR code by short code."""

        qr_code = self.qr_code_repository.get_by_short_code(short_code)
        if qr_code is None:
            raise NotFoundError("QR code not found.")
        return qr_code

    def create(self, owner_id: str, payload: QRCodeCreateRequest) -> QRCode:
        """Create a QR code while enforcing account limits."""

        if self.qr_code_repository.count_by_owner(owner_id) >= MAX_QR_CODES_PER_ACCOUNT:
            raise ConflictError("Each account can own at most 10 QR codes.")

        validated_payload = self._validate_create_payload(payload.model_dump())
        now = utc_now()

        for _ in range(10):
            qr_code = QRCode(
                owner_id=owner_id,
                name=validated_payload.name,
                type=validated_payload.type,
                content=self._serialize_content(validated_payload.content),
                short_code=generate_short_code(DEFAULT_SHORT_CODE_LENGTH),
                clicks=0,
                design=validated_payload.design.model_dump(mode="json"),
                edit_timestamps=[],
                created_at=now,
                updated_at=now,
                last_modified=now,
            )
            try:
                return self.qr_code_repository.create(qr_code)
            except DuplicateKeyError:
                continue

        raise ConflictError("Could not generate a unique short code. Please retry.")

    def update(self, owner_id: str, qr_code_id: str, payload: QRCodeUpdateRequest) -> QRCode:
        """Update a QR code while enforcing the edit rate limit."""

        existing_qr_code = self.get_owned_qr_code(owner_id, qr_code_id)
        now = utc_now()
        recent_edits = filter_recent_timestamps(
            existing_qr_code.edit_timestamps,
            now=now,
            window_seconds=60,
        )

        if len(recent_edits) >= MAX_QR_CODE_EDITS_PER_MINUTE:
            raise RateLimitError("Each QR code can be edited at most 5 times per minute.")

        merged_payload = {
            "name": payload.name or existing_qr_code.name,
            "type": payload.type or existing_qr_code.type,
            "content": self._serialize_content(payload.content)
            if payload.content is not None
            else self._serialize_content(existing_qr_code.content),
            "design": payload.design.model_dump(mode="json")
            if payload.design is not None
            else existing_qr_code.design.model_dump(mode="json"),
        }
        validated_payload = self._validate_create_payload(merged_payload)

        updated_qr_code = self.qr_code_repository.update(
            qr_code_id,
            {
                "name": validated_payload.name,
                "type": validated_payload.type,
                "content": self._serialize_content(validated_payload.content),
                "design": validated_payload.design.model_dump(mode="json"),
                "edit_timestamps": [*recent_edits, now],
                "updated_at": now,
                "last_modified": now,
            },
        )
        if updated_qr_code is None:
            raise NotFoundError("QR code not found.")
        return updated_qr_code

    def delete(self, owner_id: str, qr_code_id: str) -> None:
        """Delete a QR code after ownership validation."""

        self.get_owned_qr_code(owner_id, qr_code_id)
        deleted = self.qr_code_repository.delete(qr_code_id)
        if not deleted:
            raise NotFoundError("QR code not found.")

    def register_access(self, short_code: str, client_ip: str, user_agent: str | None) -> QRCodeResolutionResult:
        """Register a public access event and resolve the scan destination."""

        qr_code = self.get_by_short_code(short_code)
        now = utc_now()
        updated_qr_code = self.qr_code_repository.increment_clicks(qr_code.id, now)
        if updated_qr_code is None:
            raise NotFoundError("QR code not found.")

        resolution = self._resolve_destination(updated_qr_code)
        access_log = QRCodeAccess(
            qr_code_id=updated_qr_code.id,
            short_code=updated_qr_code.short_code,
            ip_address=client_ip,
            user_agent=user_agent,
            action_type=resolution.action_type,
            accessed_at=now,
        )
        self.qr_code_access_repository.create(access_log)
        return resolution

    def _validate_create_payload(self, payload: dict) -> QRCodeCreateRequest:
        """Reuse the create schema to validate create and update operations."""

        try:
            return QRCodeCreateRequest.model_validate(payload)
        except PydanticValidationError as exc:
            first_error = exc.errors()[0]
            raise ValidationError(first_error["msg"]) from exc

    def _resolve_destination(self, qr_code: QRCode) -> QRCodeResolutionResult:
        """Translate a QR code into a redirect or copy action for the client."""

        if qr_code.type == QRCodeType.URL:
            return QRCodeResolutionResult(
                qr_code=qr_code,
                action_type=QRCodeActionType.REDIRECT,
                target_url=str(qr_code.content),
            )

        if qr_code.type == QRCodeType.WHATSAPP:
            whatsapp_content = self._coerce_whatsapp_content(qr_code.content)
            encoded_message = quote(whatsapp_content.message) if whatsapp_content.message else ""
            target_url = f"https://wa.me/{whatsapp_content.phone}"
            if encoded_message:
                target_url = f"{target_url}?text={encoded_message}"

            return QRCodeResolutionResult(
                qr_code=qr_code,
                action_type=QRCodeActionType.REDIRECT,
                target_url=target_url,
            )

        return QRCodeResolutionResult(
            qr_code=qr_code,
            action_type=QRCodeActionType.COPY,
            copy_value=str(qr_code.content),
        )

    def _serialize_content(self, content) -> str | dict | None:
        """Normalize content values before persisting them to MongoDB."""

        if hasattr(content, "model_dump"):
            return content.model_dump()
        return content

    def _coerce_whatsapp_content(self, content: str | WhatsAppContent | dict) -> WhatsAppContent:
        """Normalize stored WhatsApp payloads into the domain class."""

        if isinstance(content, WhatsAppContent):
            return content
        return WhatsAppContent.model_validate(content)
