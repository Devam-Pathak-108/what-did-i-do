from pydantic import BaseModel, Field


class ProfileUpdateRequest(BaseModel):
    tell_me_about_your_life: str = Field(
        default="",
        max_length=5000,
        description="Free-form description of the user's life",
    )


class ProfileResponse(BaseModel):
    user_id: str
    username: str
    email: str
    is_verified: bool
    tell_me_about_your_life: str
