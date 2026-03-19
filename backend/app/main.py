from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.db.indexes import ensure_indexes
from app.db.mongodb import create_mongo_connection
from app.middleware.auth import AuthenticationMiddleware


def create_app() -> FastAPI:
    """Application factory for the FlexQR backend."""

    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        mongo_connection = create_mongo_connection(settings)
        mongo_connection.ping()
        ensure_indexes(mongo_connection.database)

        app.state.mongo_connection = mongo_connection
        app.state.database = mongo_connection.database
        app.state.settings = settings

        try:
            yield
        finally:
            mongo_connection.close()

    app = FastAPI(
        title=settings.project_name,
        version="1.0.0",
        description=(
            "Layered FastAPI backend for the FlexQR platform. "
            "It supports local authentication, Google authentication, "
            "MongoDB persistence, and QR code business rules."
        ),
        docs_url="/docs" if settings.enable_api_docs else None,
        redoc_url="/redoc" if settings.enable_api_docs else None,
        openapi_url="/openapi.json" if settings.enable_api_docs else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(AuthenticationMiddleware, settings=settings)

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, error: AppError) -> JSONResponse:
        """Convert application exceptions into a standard JSON response."""

        payload = {
            "detail": error.detail,
            "code": error.code,
        }
        if error.extra:
            payload["extra"] = error.extra
        return JSONResponse(status_code=error.status_code, content=payload)

    @app.exception_handler(RequestValidationError)
    async def handle_request_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
        """Normalize FastAPI request validation errors."""

        return JSONResponse(
            status_code=422,
            content={
                "detail": "The request payload is invalid.",
                "code": "request_validation_error",
                "extra": {"errors": error.errors()},
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, error: Exception) -> JSONResponse:
        """Protect clients from internal exception details."""

        return JSONResponse(
            status_code=500,
            content={
                "detail": "Unexpected internal server error.",
                "code": "internal_server_error",
            },
        )

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
