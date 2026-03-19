from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.qrcodes import router as qrcode_router
from app.api.v1.endpoints.users import router as user_router


router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(user_router)
router.include_router(qrcode_router)
