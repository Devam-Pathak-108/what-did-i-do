from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.services import chat_ai
from app.utils.datetime_ist import ist_date, now_ist, to_ist

EMPTY_DAY_REPLY = "I don't have anything for that day."
RECENT_HISTORY_LIMIT = 20


def _as_object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}",
        )
    return ObjectId(value)


def _serialize_message(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "message_id": str(doc["_id"]),
        "type": doc["type"],
        "message": doc["message"],
        "datetime": to_ist(doc["datetime"]),
        "session_id": str(doc["session_id"]),
        "intent": doc.get("intent"),
    }


async def create_session(user_id: str, *, make_active: bool = True) -> dict[str, Any]:
    """Explicitly create a new chat session and return it (session_id = _id)."""
    db = get_database()
    user_oid = _as_object_id(user_id, "user_id")
    now = now_ist()

    if make_active:
        # New chat becomes the current active session.
        await db.chat_sessions.update_many(
            {"user_id": user_oid, "is_active": True},
            {"$set": {"is_active": False, "updated_at": now}},
        )

    doc = {
        "user_id": user_oid,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.chat_sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_or_create_session(user_id: str, session_id: str | None = None) -> dict[str, Any]:
    db = get_database()
    user_oid = _as_object_id(user_id, "user_id")

    # Client-supplied id: lookup only (never invent that id).
    if session_id:
        session = await db.chat_sessions.find_one(
            {"_id": _as_object_id(session_id, "session_id"), "user_id": user_oid}
        )
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )
        return session

    session = await db.chat_sessions.find_one(
        {"user_id": user_oid, "is_active": True},
        sort=[("updated_at", -1)],
    )
    if session is not None:
        return session

    return await create_session(user_id, make_active=True)


async def list_sessions(
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
    user_oid = _as_object_id(user_id, "user_id")
    query = {"user_id": user_oid}
    total = await db.chat_sessions.count_documents(query)
    skip = (page - 1) * limit

    cursor = (
        db.chat_sessions.find(query)
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )
    sessions = await cursor.to_list(length=limit)

    items: list[dict[str, Any]] = []
    for session in sessions:
        first = await db.chat_messages.find_one(
            {
                "user_id": user_oid,
                "session_id": session["_id"],
                "type": "asked",
                "visible_in_chat": True,
            },
            sort=[("datetime", 1)],
        )
        items.append(
            {
                "session_id": str(session["_id"]),
                "is_active": bool(session.get("is_active", False)),
                "created_at": to_ist(session["created_at"]),
                "updated_at": to_ist(session["updated_at"]),
                "first_message": first.get("message") if first else None,
            }
        )

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "sessions": items,
    }


async def _touch_session(session_id: ObjectId) -> None:
    db = get_database()
    await db.chat_sessions.update_one(
        {"_id": session_id},
        {"$set": {"updated_at": now_ist()}},
    )


async def get_recent_conversation_history(
    user_id: str,
    session_id: ObjectId,
    limit: int = RECENT_HISTORY_LIMIT,
) -> list[dict[str, Any]]:
    db = get_database()
    cursor = (
        db.chat_messages.find(
            {
                "user_id": _as_object_id(user_id, "user_id"),
                "session_id": session_id,
                "visible_in_chat": True,
            }
        )
        .sort("datetime", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    docs.reverse()
    return [
        {
            "type": doc["type"],
            "message": doc["message"],
            "datetime": to_ist(doc["datetime"]),
            "intent": doc.get("intent"),
        }
        for doc in docs
    ]


async def _insert_message(
    *,
    user_id: str,
    session_id: ObjectId,
    message_type: str,
    message: str,
    intent: int | None,
    visible_in_chat: bool,
    at: datetime | None = None,
) -> dict[str, Any]:
    db = get_database()
    now = at or now_ist()
    doc = {
        "user_id": _as_object_id(user_id, "user_id"),
        "session_id": session_id,
        "type": message_type,
        "message": message,
        "datetime": now,
        "intent": intent,
        "visible_in_chat": visible_in_chat,
        "created_at": now,
    }
    result = await db.chat_messages.insert_one(doc)
    doc["_id"] = result.inserted_id
    await _touch_session(session_id)
    return doc


async def _store_day_summary(
    *,
    user_id: str,
    session_id: ObjectId,
    asked_message_id: ObjectId,
    raw_data: str,
    entry_dt: datetime,
    summary: str,
    reply: str,
) -> dict[str, Any]:
    db = get_database()
    now = now_ist()
    entry_dt = to_ist(entry_dt)
    doc = {
        "user_id": _as_object_id(user_id, "user_id"),
        "session_id": session_id,
        "asked_message_id": asked_message_id,
        "raw_data": raw_data,
        "date": entry_dt,
        "entry_date": ist_date(entry_dt).isoformat(),
        "summary": summary,
        "reply": reply,
        "created_at": now,
    }
    result = await db.day_summaries.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def _store_recall(
    *,
    user_id: str,
    session_id: ObjectId,
    asked_message_id: ObjectId,
    raw_data: str,
    entry_dt: datetime,
    specifics_to_fetch: str,
    reply: str,
) -> dict[str, Any]:
    db = get_database()
    now = now_ist()
    entry_dt = to_ist(entry_dt)
    doc = {
        "user_id": _as_object_id(user_id, "user_id"),
        "session_id": session_id,
        "asked_message_id": asked_message_id,
        "raw_data": raw_data,
        "date": entry_dt,
        "entry_date": ist_date(entry_dt).isoformat(),
        "specifics_to_fetch": specifics_to_fetch,
        "reply": reply,
        "created_at": now,
    }
    result = await db.recalls.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def _fetch_type0_summaries_for_date(
    user_id: str,
    entry_dt: datetime,
) -> list[dict[str, Any]]:
    db = get_database()
    day_key = ist_date(entry_dt).isoformat()
    cursor = db.day_summaries.find(
        {
            "user_id": _as_object_id(user_id, "user_id"),
            "entry_date": day_key,
        }
    ).sort("created_at", 1)
    return await cursor.to_list(length=1000)


async def _run_type_0(
    *,
    user_id: str,
    session_id: ObjectId,
    asked_message_id: ObjectId,
    raw_data: str,
    conversation_history: list[dict[str, Any]],
) -> dict[str, Any]:
    extracted = await chat_ai.extract_daily_life(raw_data)
    entry_dt = to_ist(extracted["date"])
    summary = extracted["summary"]
    reply = await chat_ai.generate_daily_reply(
        raw_data,
        conversation_history=conversation_history,
    )
    await _store_day_summary(
        user_id=user_id,
        session_id=session_id,
        asked_message_id=asked_message_id,
        raw_data=raw_data,
        entry_dt=entry_dt,
        summary=summary,
        reply=reply,
    )
    return {"date": entry_dt, "summary": summary, "reply": reply}


async def _run_type_1(
    *,
    user_id: str,
    session_id: ObjectId,
    asked_message_id: ObjectId,
    raw_data: str,
    conversation_history: list[dict[str, Any]],
) -> dict[str, Any]:
    extracted = await chat_ai.extract_recall_query(raw_data)
    entry_dt = to_ist(extracted["date"])
    specifics = extracted["specifics_to_fetch"]
    summaries = await _fetch_type0_summaries_for_date(user_id, entry_dt)

    if not summaries:
        reply = EMPTY_DAY_REPLY
    else:
        reply = await chat_ai.generate_recall_reply(
            summaries,
            specifics,
            conversation_history=conversation_history,
        )

    await _store_recall(
        user_id=user_id,
        session_id=session_id,
        asked_message_id=asked_message_id,
        raw_data=raw_data,
        entry_dt=entry_dt,
        specifics_to_fetch=specifics,
        reply=reply,
    )
    return {
        "date": entry_dt,
        "specifics_to_fetch": specifics,
        "reply": reply,
        "summaries": summaries,
    }


async def send_chat(
    user_id: str,
    raw_data: str,
    session_id: str | None = None,
) -> dict[str, Any]:
    session = await get_or_create_session(user_id, session_id)
    session_oid = session["_id"]

    conversation_history = await get_recent_conversation_history(user_id, session_oid)
    intent = await chat_ai.classify_intent(raw_data)
    if intent not in (0, 1, 2):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid intent classification result",
        )

    asked_at = now_ist()
    asked = await _insert_message(
        user_id=user_id,
        session_id=session_oid,
        message_type="asked",
        message=raw_data,
        intent=intent,
        visible_in_chat=True,
        at=asked_at,
    )

    visible_reply_text: str
    if intent == 0:
        result = await _run_type_0(
            user_id=user_id,
            session_id=session_oid,
            asked_message_id=asked["_id"],
            raw_data=raw_data,
            conversation_history=conversation_history,
        )
        visible_reply_text = result["reply"]
    elif intent == 1:
        result = await _run_type_1(
            user_id=user_id,
            session_id=session_oid,
            asked_message_id=asked["_id"],
            raw_data=raw_data,
            conversation_history=conversation_history,
        )
        visible_reply_text = result["reply"]
    else:
        type_0 = await _run_type_0(
            user_id=user_id,
            session_id=session_oid,
            asked_message_id=asked["_id"],
            raw_data=raw_data,
            conversation_history=conversation_history,
        )
        type_1 = await _run_type_1(
            user_id=user_id,
            session_id=session_oid,
            asked_message_id=asked["_id"],
            raw_data=raw_data,
            conversation_history=conversation_history,
        )
        # Store type 0 / 1 replies for internal use; hide from chat history.
        hidden_at = now_ist()
        await _insert_message(
            user_id=user_id,
            session_id=session_oid,
            message_type="reply",
            message=type_0["reply"],
            intent=0,
            visible_in_chat=False,
            at=hidden_at,
        )
        await _insert_message(
            user_id=user_id,
            session_id=session_oid,
            message_type="reply",
            message=type_1["reply"],
            intent=1,
            visible_in_chat=False,
            at=hidden_at,
        )
        visible_reply_text = await chat_ai.merge_replies(
            type_0["reply"],
            type_1["reply"],
        )

    reply = await _insert_message(
        user_id=user_id,
        session_id=session_oid,
        message_type="reply",
        message=visible_reply_text,
        intent=intent,
        visible_in_chat=True,
        at=now_ist(),
    )

    messages = sorted(
        [_serialize_message(asked), _serialize_message(reply)],
        key=lambda item: item["datetime"],
        reverse=True,
    )
    return {
        "session_id": str(session_oid),
        "messages": messages,
    }


async def list_sessions(
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
    user_oid = _as_object_id(user_id, "user_id")
    query = {"user_id": user_oid}

    total = await db.chat_sessions.count_documents(query)
    skip = (page - 1) * limit
    cursor = (
        db.chat_sessions.find(query)
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )
    sessions = await cursor.to_list(length=limit)

    session_ids = [doc["_id"] for doc in sessions]
    first_by_session: dict[ObjectId, str] = {}
    if session_ids:
        pipeline = [
            {
                "$match": {
                    "user_id": user_oid,
                    "session_id": {"$in": session_ids},
                    "type": "asked",
                    "visible_in_chat": True,
                }
            },
            {"$sort": {"datetime": 1}},
            {
                "$group": {
                    "_id": "$session_id",
                    "first_message": {"$first": "$message"},
                }
            },
        ]
        async for row in db.chat_messages.aggregate(pipeline):
            first_by_session[row["_id"]] = row["first_message"]

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "sessions": [
            {
                "session_id": str(doc["_id"]),
                "is_active": bool(doc.get("is_active", False)),
                "created_at": to_ist(doc["created_at"]),
                "updated_at": to_ist(doc["updated_at"]),
                "first_message": first_by_session.get(doc["_id"]),
            }
            for doc in sessions
        ],
    }


async def get_chat_history(
    user_id: str,
    session_id: str | None = None,
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

    session = await get_or_create_session(user_id, session_id)
    session_oid = session["_id"]
    db = get_database()
    query = {
        "user_id": _as_object_id(user_id, "user_id"),
        "session_id": session_oid,
        "visible_in_chat": True,
    }

    total = await db.chat_messages.count_documents(query)
    skip = (page - 1) * limit
    cursor = (
        db.chat_messages.find(query)
        .sort("datetime", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return {
        "session_id": str(session_oid),
        "page": page,
        "limit": limit,
        "total": total,
        "messages": [_serialize_message(doc) for doc in docs],
    }
