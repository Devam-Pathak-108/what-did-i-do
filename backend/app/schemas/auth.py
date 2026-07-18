from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SendOTPRequest(BaseModel):
    user_id: str


class VerifyOTPRequest(BaseModel):
    user_id: str
    otp: str = Field(min_length=4, max_length=10)


class LoginRequest(BaseModel):
    identifier: str = Field(
        description="Username or email",
        min_length=3,
        max_length=254,
    )
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    email: str
    is_verified: bool


class RegisterResponse(BaseModel):
    message: str
    user_id: str
    email: str
    is_verified: bool


class MessageResponse(BaseModel):
    message: str
