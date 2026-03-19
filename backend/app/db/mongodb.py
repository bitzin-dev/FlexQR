from __future__ import annotations

from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import Settings


class MongoConnection:
    """Owns the MongoDB client and exposes the selected database."""

    def __init__(self, settings: Settings) -> None:
        self.client = MongoClient(settings.mongo_uri)
        self.database: Database = self.client[settings.mongo_database]

    def ping(self) -> None:
        """Validate the database connection during application startup."""

        self.client.admin.command("ping")

    def close(self) -> None:
        """Close the MongoDB client when the application stops."""

        self.client.close()


def create_mongo_connection(settings: Settings) -> MongoConnection:
    """Create a MongoDB connection wrapper from environment settings."""

    return MongoConnection(settings)
