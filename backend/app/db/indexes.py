from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.database import Database


def ensure_indexes(database: Database) -> None:
    """Create all indexes required by the FlexQR backend."""

    database.users.create_indexes(
        [
            IndexModel([("email", ASCENDING)], unique=True, name="uq_users_email"),
            IndexModel(
                [("google_sub", ASCENDING)],
                unique=True,
                sparse=True,
                name="uq_users_google_sub",
            ),
        ]
    )

    database.qr_codes.create_indexes(
        [
            IndexModel([("owner_id", ASCENDING)], name="idx_qr_codes_owner_id"),
            IndexModel([("short_code", ASCENDING)], unique=True, name="uq_qr_codes_short_code"),
            IndexModel([("updated_at", DESCENDING)], name="idx_qr_codes_updated_at"),
        ]
    )

    database.qr_code_accesses.create_indexes(
        [
            IndexModel([("qr_code_id", ASCENDING)], name="idx_qr_code_accesses_qr_code_id"),
            IndexModel([("short_code", ASCENDING)], name="idx_qr_code_accesses_short_code"),
            IndexModel([("accessed_at", DESCENDING)], name="idx_qr_code_accesses_accessed_at"),
            IndexModel([("ip_address", ASCENDING)], name="idx_qr_code_accesses_ip_address"),
        ]
    )
