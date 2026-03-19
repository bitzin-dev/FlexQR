from __future__ import annotations

from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import ValidationError


class MongoRepository:
    """Base repository with common MongoDB helpers."""

    collection_name: str = ""

    def __init__(self, database: Database) -> None:
        self.database = database

    @property
    def collection(self) -> Collection:
        """Return the MongoDB collection bound to this repository."""

        return self.database[self.collection_name]

    @staticmethod
    def normalize_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
        """Convert MongoDB _id values to string-based id values."""

        if document is None:
            return None

        normalized = dict(document)
        normalized["id"] = str(normalized.pop("_id"))
        return normalized

    @staticmethod
    def to_object_id(value: str) -> ObjectId:
        """Convert a string identifier into a MongoDB ObjectId."""

        try:
            return ObjectId(value)
        except InvalidId as exc:
            raise ValidationError("The supplied identifier is invalid.") from exc
