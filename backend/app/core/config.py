from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Environment-backed application settings."""

    environment: str = "development"
    project_name: str = "FlexQR Backend"
    api_v1_prefix: str = "/api/v1"
    enable_api_docs: bool = True
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_database: str = "flexqr"
    jwt_secret_key: str = "change-this-secret-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    google_client_id: str | None = None
    frontend_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, value: str | list[str]) -> list[str]:
        """Allow comma-separated CORS origins inside the .env file."""

        if isinstance(value, str):
            stripped_value = value.strip()
            if stripped_value.startswith("["):
                parsed_value = json.loads(stripped_value)
                if isinstance(parsed_value, list):
                    return [str(item).strip() for item in parsed_value if str(item).strip()]
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance for the process."""

    return Settings()
