"""
Project Schemas (Pydantic)
--------------------------
Request and response schemas for the projects module.
Pydantic validates everything automatically.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Request Schemas ───────────────────────────────────────────


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""
    name: str = Field(..., min_length=1, max_length=255, examples=["Sprint Board Alpha"])
    description: Optional[str] = Field(None, examples=["An agile project for team collaboration"])


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, examples=["Renamed Project"])
    description: Optional[str] = Field(None, examples=["Updated description"])


# ── Response Schemas ──────────────────────────────────────────


class ProjectResponse(BaseModel):
    """Schema returned when reading a project."""
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectDeleteResponse(BaseModel):
    """Schema returned after deleting a project."""
    message: str
