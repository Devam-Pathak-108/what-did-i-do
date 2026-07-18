from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.schemas.auth import LoginRequest, RegisterRequest
from app.utils.jwt import create_access_token
from app.utils.password import hash_password, verify_password


async def register_user(payload: RegisterRequest) -> dict:
    db = get_database()

    existing = await db.users.find_one(
        {
            "$or": [
                {"email": payload.email.lower()},
                {"username": payload.username.lower()},
            ]
        }
    )
    if existing:
        if existing["email"] == payload.email.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    now = datetime.now(timezone.utc)
    document = {
        "username": payload.username.lower(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "is_verified": False,
        "tell_me_about_your_life": "",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(document)
    return {
        "user_id": str(result.inserted_id),
        "email": document["email"],
        "is_verified": False,
    }


async def login_user(payload: LoginRequest) -> dict:
    db = get_database()
    identifier = payload.identifier.strip().lower()

    user = await db.users.find_one(
        {
            "$or": [
                {"email": identifier},
                {"username": identifier},
            ]
        }
    )
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify OTP first.",
        )

    user_id = str(user["_id"])
    token = create_access_token(
        subject=user_id,
        extra_claims={"username": user["username"], "email": user["email"]},
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user_id,
        "username": user["username"],
        "email": user["email"],
        "is_verified": True,
    }


async def get_user_by_id(user_id: str) -> dict | None:
    if not ObjectId.is_valid(user_id):
        return None
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        return None
    user["id"] = str(user["_id"])
    return user
