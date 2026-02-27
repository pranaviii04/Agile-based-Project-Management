"""
Sprint Schemas (Pydantic)
-------------------------
Request and response schemas for the sprints module.
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.sprints.models import SprintStatus


# ── Request Schemas ───────────────────────────────────────────


class SprintCreate(BaseModel):
    """Schema for creating a new sprint."""
    name: str = Field(..., min_length=1, max_length=255, examples=["Sprint 1"])
    project_id: UUID = Field(..., description="UUID of the parent project")
    start_date: date = Field(..., description="Sprint start date")
    end_date: date = Field(..., description="Sprint end date")
    status: SprintStatus = SprintStatus.PLANNED

    @model_validator(mode="after")
    def end_date_must_be_after_start_date(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class SprintStatusUpdate(BaseModel):
    """Schema for updating only the sprint status."""
    status: SprintStatus


class SprintUpdate(BaseModel):
    """Schema for a full sprint update (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, examples=["Sprint 2"])
    start_date: Optional[date] = Field(None, description="Updated start date")
    end_date: Optional[date] = Field(None, description="Updated end date")
    status: Optional[SprintStatus] = None

    @model_validator(mode="after")
    def end_date_must_be_after_start_date(self):
        if self.start_date is not None and self.end_date is not None:
            if self.end_date <= self.start_date:
                raise ValueError("end_date must be after start_date")
        return self


# ── Response Schemas ──────────────────────────────────────────


class SprintResponse(BaseModel):
    """Schema returned when reading a sprint."""
    id: UUID
    name: str
    project_id: UUID
    start_date: date
    end_date: date
    status: SprintStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
