from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.database import get_database
from app.middleware.auth import get_current_verified_user
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> ProfileResponse:
    return ProfileResponse(
        user_id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        is_verified=current_user.get("is_verified", False),
        tell_me_about_your_life=current_user.get("tell_me_about_your_life", ""),
    )


@router.put("", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> ProfileResponse:
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {
            "$set": {
                "tell_me_about_your_life": payload.tell_me_about_your_life,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return ProfileResponse(
        user_id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        is_verified=current_user.get("is_verified", False),
        tell_me_about_your_life=payload.tell_me_about_your_life,
    )
