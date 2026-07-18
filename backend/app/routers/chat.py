from typing import Any

from fastapi import APIRouter, Depends, Query

from app.middleware.auth import get_current_verified_user
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatSendRequest,
    ChatSendResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
)
from app.services import chat_service
from app.utils.datetime_ist import to_ist

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_chat_session(
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> ChatSessionResponse:
    """Create a new chat session and return its session_id."""
    session = await chat_service.create_session(current_user["id"])
    return ChatSessionResponse(
        session_id=str(session["_id"]),
        is_active=session["is_active"],
        created_at=to_ist(session["created_at"]),
        updated_at=to_ist(session["updated_at"]),
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_chat_sessions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> ChatSessionListResponse:
    """List all chat sessions for the current user, with first user message text."""
    result = await chat_service.list_sessions(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return ChatSessionListResponse(**result)


@router.post("", response_model=ChatSendResponse)
async def send_chat_message(
    payload: ChatSendRequest,
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> ChatSendResponse:
    result = await chat_service.send_chat(
        user_id=current_user["id"],
        raw_data=payload.raw_data,
        session_id=payload.session_id,
    )
    return ChatSendResponse(**result)


@router.get("/messages", response_model=ChatHistoryResponse)
async def list_chat_messages(
    session_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> ChatHistoryResponse:
    result = await chat_service.get_chat_history(
        user_id=current_user["id"],
        session_id=session_id,
        page=page,
        limit=limit,
    )
    return ChatHistoryResponse(**result)
