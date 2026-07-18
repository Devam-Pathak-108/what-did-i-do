from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class SummaryCreateRequest(BaseModel):
    type: Literal["date_range", "month"]
    start_date: date | None = None
    end_date: date | None = None
    month: int | None = Field(default=None, ge=1, le=12)
    year: int | None = Field(default=None, ge=1970, le=2100)

    @model_validator(mode="after")
    def validate_by_type(self) -> "SummaryCreateRequest":
        if self.type == "date_range":
            if self.start_date is None or self.end_date is None:
                raise ValueError("start_date and end_date are required when type is date_range")
            if self.start_date > self.end_date:
                raise ValueError("start_date must be on or before end_date")
        else:
            if self.month is None or self.year is None:
                raise ValueError("month and year are required when type is month")
        return self


class SummaryItem(BaseModel):
    summary_id: str
    type: Literal["date_range", "month"]
    start_date: date
    end_date: date
    month: int | None = None
    year: int | None = None
    reply: str
    score: float
    gif_url: str
    created_at: datetime


class SummaryCreateResponse(BaseModel):
    summary_id: str
    type: Literal["date_range", "month"]
    start_date: date
    end_date: date
    reply: str
    score: float
    gif_url: str


class SummaryListResponse(BaseModel):
    page: int
    limit: int
    total: int
    summaries: list[SummaryItem]
