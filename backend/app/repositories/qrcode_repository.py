from __future__ import annotations

from datetime import datetime

from pymongo import DESCENDING, ReturnDocument

from app.models.qrcode import QRCode
from app.repositories.base import MongoRepository


class QRCodeRepository(MongoRepository):
    """MongoDB repository for managed QR codes."""

    collection_name = "qr_codes"

    def list_by_owner(self, owner_id: str) -> list[QRCode]:
        """Return all QR codes owned by one account."""

        documents = self.collection.find({"owner_id": owner_id}).sort("updated_at", DESCENDING)
        return [QRCode.from_mongo(document) for document in documents]

    def count_by_owner(self, owner_id: str) -> int:
        """Count how many QR codes belong to one account."""

        return self.collection.count_documents({"owner_id": owner_id})

    def get_by_id(self, qr_code_id: str) -> QRCode | None:
        """Return a QR code by its MongoDB identifier."""

        document = self.collection.find_one({"_id": self.to_object_id(qr_code_id)})
        return QRCode.from_mongo(document) if document else None

    def get_by_short_code(self, short_code: str) -> QRCode | None:
        """Return a QR code by its public short code."""

        document = self.collection.find_one({"short_code": short_code})
        return QRCode.from_mongo(document) if document else None

    def create(self, qr_code: QRCode) -> QRCode:
        """Persist a new QR code and return the stored entity."""

        result = self.collection.insert_one(qr_code.to_mongo())
        stored_document = self.collection.find_one({"_id": result.inserted_id})
        return QRCode.from_mongo(stored_document)

    def update(self, qr_code_id: str, updates: dict) -> QRCode | None:
        """Apply partial updates to one QR code."""

        document = self.collection.find_one_and_update(
            {"_id": self.to_object_id(qr_code_id)},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
        return QRCode.from_mongo(document) if document else None

    def delete(self, qr_code_id: str) -> bool:
        """Delete one QR code by identifier."""

        result = self.collection.delete_one({"_id": self.to_object_id(qr_code_id)})
        return result.deleted_count > 0

    def increment_clicks(self, qr_code_id: str, accessed_at: datetime) -> QRCode | None:
        """Increment the click counter and store the last access timestamp."""

        document = self.collection.find_one_and_update(
            {"_id": self.to_object_id(qr_code_id)},
            {"$inc": {"clicks": 1}, "$set": {"last_accessed_at": accessed_at}},
            return_document=ReturnDocument.AFTER,
        )
        return QRCode.from_mongo(document) if document else None
