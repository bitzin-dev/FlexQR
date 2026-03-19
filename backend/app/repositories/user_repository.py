from __future__ import annotations

from pymongo import ReturnDocument

from app.models.user import User
from app.repositories.base import MongoRepository


class UserRepository(MongoRepository):
    """MongoDB repository for FlexQR users."""

    collection_name = "users"

    def get_by_id(self, user_id: str) -> User | None:
        """Return one user by MongoDB identifier."""

        document = self.collection.find_one({"_id": self.to_object_id(user_id)})
        return User.from_mongo(document) if document else None

    def get_by_email(self, email: str) -> User | None:
        """Return one user by unique email address."""

        document = self.collection.find_one({"email": email.lower()})
        return User.from_mongo(document) if document else None

    def get_by_google_sub(self, google_sub: str) -> User | None:
        """Return one user by the unique Google subject identifier."""

        document = self.collection.find_one({"google_sub": google_sub})
        return User.from_mongo(document) if document else None

    def create(self, user: User) -> User:
        """Persist a new user document and return the stored entity."""

        result = self.collection.insert_one(user.to_mongo())
        stored_document = self.collection.find_one({"_id": result.inserted_id})
        return User.from_mongo(stored_document)

    def update(self, user_id: str, updates: dict) -> User | None:
        """Apply partial updates and return the updated user."""

        document = self.collection.find_one_and_update(
            {"_id": self.to_object_id(user_id)},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
        return User.from_mongo(document) if document else None
