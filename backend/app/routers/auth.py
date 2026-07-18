from fastapi import APIRouter

from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    SendOTPRequest,
    TokenResponse,
    VerifyOTPRequest,
)
from app.services import auth_service, otp_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest) -> RegisterResponse:
    result = await auth_service.register_user(payload)
    return RegisterResponse(
        message="Registration successful. Please verify your email with the OTP.",
        user_id=result["user_id"],
        email=result["email"],
        is_verified=result["is_verified"],
    )


@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(payload: SendOTPRequest) -> MessageResponse:
    await otp_service.create_and_send_otp(payload.user_id)
    return MessageResponse(message="OTP sent to your registered email")


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(payload: VerifyOTPRequest) -> MessageResponse:
    await otp_service.verify_otp(payload.user_id, payload.otp)
    return MessageResponse(message="Email verified successfully. You can now log in.")


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    result = await auth_service.login_user(payload)
    return TokenResponse(**result)
