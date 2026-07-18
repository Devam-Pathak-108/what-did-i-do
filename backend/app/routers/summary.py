from typing import Any

from fastapi import APIRouter, Depends, Query

from app.middleware.auth import get_current_verified_user
from app.schemas.summary import (
    SummaryCreateRequest,
    SummaryCreateResponse,
    SummaryListResponse,
)
from app.services import summary_service

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.post("", response_model=SummaryCreateResponse)
async def create_summary(
    payload: SummaryCreateRequest,
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> SummaryCreateResponse:
    result = await summary_service.create_period_summary(
        user_id=current_user["id"],
        summary_type=payload.type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        month=payload.month,
        year=payload.year,
    )
    return SummaryCreateResponse(**result)


@router.get("", response_model=SummaryListResponse)
async def list_summaries(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_verified_user),
) -> SummaryListResponse:
    result = await summary_service.list_period_summaries(
        user_id=current_user["id"],
        page=page,
        limit=limit,
    )
    return SummaryListResponse(**result)
