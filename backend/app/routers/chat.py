from typing import Any

from fastapi import APIRouter, Depends, Query

from app.middleware.auth import get_current_verified_user
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatSendRequest,
    ChatSendResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])


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
