"""
Sprint Schemas (Pydantic)
-------------------------
Request and response schemas for the sprints module.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.sprints.models import SprintStatus


# ── Request Schemas ───────────────────────────────────────────


class SprintCreate(BaseModel):
    """Schema for creating a new sprint."""
    name: str = Field(..., min_length=1, max_length=255)
    goal: Optional[str] = None
    project_id: int
    status: SprintStatus = SprintStatus.PLANNING
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SprintUpdate(BaseModel):
    """Schema for updating an existing sprint (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    goal: Optional[str] = None
    status: Optional[SprintStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# ── Response Schemas ──────────────────────────────────────────


class SprintResponse(BaseModel):
    """Schema returned when reading a sprint."""
    id: int
    name: str
    goal: Optional[str]
    project_id: int
    status: SprintStatus
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True
