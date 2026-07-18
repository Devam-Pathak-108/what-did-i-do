from datetime import datetime

from pydantic import BaseModel, Field


class ChatSendRequest(BaseModel):
    raw_data: str = Field(min_length=1, max_length=20000)
    session_id: str | None = None


class ChatSessionResponse(BaseModel):
    session_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ChatSessionListItem(BaseModel):
    session_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    first_message: str | None = None


class ChatSessionListResponse(BaseModel):
    page: int
    limit: int
    total: int
    sessions: list[ChatSessionListItem]


class ChatMessageItem(BaseModel):
    message_id: str
    type: str = Field(description='"asked" or "reply"')
    message: str
    datetime: datetime
    session_id: str
    intent: int | None = None


class ChatSendResponse(BaseModel):
    session_id: str
    messages: list[ChatMessageItem]


class ChatHistoryResponse(BaseModel):
    session_id: str
    page: int
    limit: int
    total: int
    messages: list[ChatMessageItem]
