from fastapi import APIRouter, Request, Response, status

from app.api.deps import CurrentUserDep, QRCodeServiceDep
from app.schemas.qrcode import (
    QRCodeAccessResponse,
    QRCodeCreateRequest,
    QRCodePublicResponse,
    QRCodeResponse,
    QRCodeUpdateRequest,
)
from app.utils.network import get_client_ip


router = APIRouter(prefix="/qrcodes", tags=["QR Codes"])


@router.get("", response_model=list[QRCodeResponse], summary="List current user QR codes")
def list_qr_codes(current_user: CurrentUserDep, qr_code_service: QRCodeServiceDep) -> list[QRCodeResponse]:
    """Return all QR codes owned by the authenticated user."""

    qr_codes = qr_code_service.list_by_owner(current_user.id)
    return [QRCodeResponse.from_domain(qr_code) for qr_code in qr_codes]


@router.get(
    "/shortcodes/{short_code}",
    response_model=QRCodePublicResponse,
    summary="Get QR code by short code",
)
def get_qr_code_by_short_code(short_code: str, qr_code_service: QRCodeServiceDep) -> QRCodePublicResponse:
    """Return one QR code using its public short code."""

    qr_code = qr_code_service.get_by_short_code(short_code)
    return QRCodePublicResponse.from_domain(qr_code)


@router.post(
    "/shortcodes/{short_code}/access",
    response_model=QRCodeAccessResponse,
    summary="Register QR code access",
)
def register_qr_code_access(
    short_code: str,
    request: Request,
    qr_code_service: QRCodeServiceDep,
) -> QRCodeAccessResponse:
    """Register one public access and return the client action."""

    resolution = qr_code_service.register_access(
        short_code=short_code,
        client_ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return QRCodeAccessResponse.from_domain(resolution)


@router.get("/{qr_code_id}", response_model=QRCodeResponse, summary="Get owned QR code by id")
def get_owned_qr_code(
    qr_code_id: str,
    current_user: CurrentUserDep,
    qr_code_service: QRCodeServiceDep,
) -> QRCodeResponse:
    """Return one QR code only when it belongs to the current user."""

    qr_code = qr_code_service.get_owned_qr_code(current_user.id, qr_code_id)
    return QRCodeResponse.from_domain(qr_code)


@router.post("", response_model=QRCodeResponse, status_code=status.HTTP_201_CREATED, summary="Create QR code")
def create_qr_code(
    payload: QRCodeCreateRequest,
    current_user: CurrentUserDep,
    qr_code_service: QRCodeServiceDep,
) -> QRCodeResponse:
    """Create one QR code for the current authenticated user."""

    qr_code = qr_code_service.create(current_user.id, payload)
    return QRCodeResponse.from_domain(qr_code)


@router.put("/{qr_code_id}", response_model=QRCodeResponse, summary="Update QR code")
def update_qr_code(
    qr_code_id: str,
    payload: QRCodeUpdateRequest,
    current_user: CurrentUserDep,
    qr_code_service: QRCodeServiceDep,
) -> QRCodeResponse:
    """Update one QR code owned by the current authenticated user."""

    qr_code = qr_code_service.update(current_user.id, qr_code_id, payload)
    return QRCodeResponse.from_domain(qr_code)


@router.delete("/{qr_code_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete QR code")
def delete_qr_code(
    qr_code_id: str,
    current_user: CurrentUserDep,
    qr_code_service: QRCodeServiceDep,
) -> Response:
    """Delete one QR code owned by the current authenticated user."""

    qr_code_service.delete(current_user.id, qr_code_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
