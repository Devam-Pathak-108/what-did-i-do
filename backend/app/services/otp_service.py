import random
import string
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.config import get_settings
from app.database import get_database
from app.services.email_service import send_otp_email
from app.utils.password import hash_password, verify_password


def _generate_otp(length: int) -> str:
    return "".join(random.choices(string.digits, k=length))


async def create_and_send_otp(user_id: str) -> None:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id",
        )

    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified",
        )

    settings = get_settings()
    otp = _generate_otp(settings.otp_length)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)

    await db.otps.delete_many({"user_id": ObjectId(user_id)})
    await db.otps.insert_one(
        {
            "user_id": ObjectId(user_id),
            "otp_hash": hash_password(otp),
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }
    )

    await send_otp_email(user["email"], otp)


async def verify_otp(user_id: str, otp: str) -> None:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id",
        )

    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified",
        )

    record = await db.otps.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)],
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Please request a new one.",
        )

    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        await db.otps.delete_many({"user_id": ObjectId(user_id)})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if not verify_password(otp, record["otp_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc)}},
    )
    await db.otps.delete_many({"user_id": ObjectId(user_id)})
