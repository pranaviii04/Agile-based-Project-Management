"""
Project Schemas (Pydantic)
--------------------------
Request and response schemas for the projects module.
Pydantic handles all validation automatically.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.projects.models import ProjectStatus


# ── Request Schemas ───────────────────────────────────────────


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


# ── Response Schemas ──────────────────────────────────────────


class ProjectResponse(BaseModel):
    """Schema returned when reading a project."""
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
