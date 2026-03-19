from __future__ import annotations

from app.models.qrcode import QRCodeAccess
from app.repositories.base import MongoRepository


class QRCodeAccessRepository(MongoRepository):
    """MongoDB repository for public QR code access logs."""

    collection_name = "qr_code_accesses"

    def create(self, access_log: QRCodeAccess) -> QRCodeAccess:
        """Persist one scan/access event and return it."""

        result = self.collection.insert_one(access_log.to_mongo())
        stored_document = self.collection.find_one({"_id": result.inserted_id})
        return QRCodeAccess.from_mongo(stored_document)
