"""
Sprints Router
--------------
API endpoints for sprint management.

Endpoints:
  POST   /sprints/                          → create a new sprint
  GET    /sprints/{sprint_id}               → get a single sprint
  GET    /projects/{project_id}/sprints     → list sprints for a project
  PATCH  /sprints/{sprint_id}/status        → update sprint status
"""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.sprints.schemas import SprintCreate, SprintStatusUpdate, SprintResponse
from app.sprints import service as sprint_service

router = APIRouter(tags=["Sprints"])


# ── Create ────────────────────────────────────────────────────


@router.post(
    "/sprints",
    response_model=SprintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new sprint",
)
def create_sprint(
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new sprint under an existing project.

    Validations:
    - `project_id` must reference an existing project (404 otherwise).
    - `end_date` must be strictly after `start_date` (422 otherwise).
    """
    return sprint_service.create_sprint(db, sprint_data)


# ── Read (single) ────────────────────────────────────────────


@router.get(
    "/sprints/{sprint_id}",
    response_model=SprintResponse,
    summary="Get a sprint by ID",
)
def get_sprint(
    sprint_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single sprint by its UUID. Returns 404 if not found."""
    return sprint_service.get_sprint_by_id(db, sprint_id)


# ── Read (list by project) ───────────────────────────────────


@router.get(
    "/projects/{project_id}/sprints",
    response_model=list[SprintResponse],
    summary="List sprints for a project",
)
def list_sprints_by_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all sprints belonging to the specified project, ordered by start date.
    Returns 404 if the project does not exist.
    """
    return sprint_service.get_sprints_by_project(db, project_id)


# ── Update Status ────────────────────────────────────────────


@router.patch(
    "/sprints/{sprint_id}/status",
    response_model=SprintResponse,
    summary="Update sprint status",
)
def update_sprint_status(
    sprint_id: UUID,
    payload: SprintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the status of an existing sprint.

    Allowed values: `planned`, `active`, `completed`.
    Returns 404 if the sprint does not exist.
    """
    return sprint_service.update_sprint_status(db, sprint_id, payload.status)
