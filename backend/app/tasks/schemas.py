"""
Task & Dependency Schemas (Pydantic)
-------------------------------------
Request and response schemas for the tasks module.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.tasks.models import TaskStatus


# ── Task Request Schemas ──────────────────────────────────────


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    name: str = Field(..., min_length=1, max_length=255, examples=["Design login page"])
    description: Optional[str] = Field(None, examples=["Create wireframes and mockups"])
    duration: int = Field(..., gt=0, description="Duration in days (must be > 0)")
    priority: int = Field(1, ge=1, le=5, description="Priority 1 (low) to 5 (critical)")
    status: TaskStatus = TaskStatus.TODO
    sprint_id: UUID = Field(..., description="UUID of the parent sprint")
    assigned_to: Optional[int] = Field(None, description="User ID to assign the task to")


class TaskUpdate(BaseModel):
    """Schema for updating a task (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration: Optional[int] = Field(None, gt=0)
    priority: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None


class TaskStatusUpdate(BaseModel):
    """Schema for updating only the task status."""
    status: TaskStatus


# ── Task Response Schemas ─────────────────────────────────────


class TaskResponse(BaseModel):
    """Schema returned when reading a task."""
    id: UUID
    name: str
    description: Optional[str] = None
    duration: int
    priority: int
    status: TaskStatus
    sprint_id: UUID
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Dependency Request Schemas ────────────────────────────────


class TaskDependencyCreate(BaseModel):
    """Schema for creating a task dependency."""
    depends_on_task_id: UUID = Field(
        ..., description="UUID of the predecessor task"
    )


# ── Dependency Response Schemas ───────────────────────────────


class TaskDependencyResponse(BaseModel):
    """Schema returned when reading a dependency."""
    id: UUID
    task_id: UUID
    depends_on_task_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ── CPM Data Schema ───────────────────────────────────────────


class CPMTaskData(BaseModel):
    """Lightweight task data formatted for the CPM engine."""
    id: str
    name: str
    duration: int
    dependencies: list[str] = Field(default_factory=list)
