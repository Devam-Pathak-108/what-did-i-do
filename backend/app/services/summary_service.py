import calendar
from datetime import date, datetime, time
from typing import Any, Literal

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.services import chat_ai
from app.services.gif_service import build_gif_url, format_score_key
from app.utils.datetime_ist import IST, now_ist, to_ist


def _as_object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}",
        )
    return ObjectId(value)


def _resolve_range(
    summary_type: Literal["date_range", "month"],
    *,
    start_date: date | None,
    end_date: date | None,
    month: int | None,
    year: int | None,
) -> tuple[date, date]:
    if summary_type == "date_range":
        assert start_date is not None and end_date is not None
        return start_date, end_date

    assert month is not None and year is not None
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


async def _fetch_day_summaries(
    user_id: str,
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    db = get_database()
    cursor = db.day_summaries.find(
        {
            "user_id": _as_object_id(user_id, "user_id"),
            "entry_date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat(),
            },
        }
    ).sort([("entry_date", 1), ("created_at", 1)])
    return await cursor.to_list(length=10000)


def _serialize_period_summary(doc: dict[str, Any]) -> dict[str, Any]:
    start = doc["start_date"]
    end = doc["end_date"]
    if isinstance(start, datetime):
        start = to_ist(start).date()
    if isinstance(end, datetime):
        end = to_ist(end).date()
    score = float(doc.get("score", 0.0))
    return {
        "summary_id": str(doc["_id"]),
        "type": doc["type"],
        "start_date": start,
        "end_date": end,
        "month": doc.get("month"),
        "year": doc.get("year"),
        "reply": doc["reply"],
        "score": score,
        "gif_url": doc.get("gif_url") or build_gif_url(score),
        "created_at": to_ist(doc["created_at"]),
    }


async def create_period_summary(
    user_id: str,
    summary_type: Literal["date_range", "month"],
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    month: int | None = None,
    year: int | None = None,
) -> dict[str, Any]:
    range_start, range_end = _resolve_range(
        summary_type,
        start_date=start_date,
        end_date=end_date,
        month=month,
        year=year,
    )

    day_summaries = await _fetch_day_summaries(user_id, range_start, range_end)
    reply = await chat_ai.generate_period_summary_reply(day_summaries)
    score = float(await chat_ai.score_summary_productivity(reply))
    # Normalize to one-decimal key used for GIF filenames (e.g. -0.4)
    score = float(format_score_key(score))
    gif_url = build_gif_url(score)

    now = now_ist()
    db = get_database()
    doc: dict[str, Any] = {
        "user_id": _as_object_id(user_id, "user_id"),
        "type": summary_type,
        "start_date": datetime.combine(range_start, time.min, tzinfo=IST),
        "end_date": datetime.combine(range_end, time.min, tzinfo=IST),
        "month": month if summary_type == "month" else None,
        "year": year if summary_type == "month" else None,
        "reply": reply,
        "score": score,
        "gif_url": gif_url,
        "source_summary_ids": [item["_id"] for item in day_summaries],
        "created_at": now,
    }
    result = await db.period_summaries.insert_one(doc)
    doc["_id"] = result.inserted_id

    return {
        "summary_id": str(doc["_id"]),
        "type": summary_type,
        "start_date": range_start,
        "end_date": range_end,
        "reply": reply,
        "score": score,
        "gif_url": gif_url,
    }


async def list_period_summaries(
    user_id: str,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="page must be >= 1",
        )
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 100",
        )

    db = get_database()
    query = {"user_id": _as_object_id(user_id, "user_id")}
    total = await db.period_summaries.count_documents(query)
    skip = (page - 1) * limit
    cursor = (
        db.period_summaries.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "summaries": [_serialize_period_summary(doc) for doc in docs],
    }
