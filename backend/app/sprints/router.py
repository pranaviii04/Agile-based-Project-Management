"""
Sprints Router
--------------
API endpoints for sprint management.

Endpoints:
  POST   /sprints/                          → create a new sprint        [scrum_master]
  GET    /sprints                           → list all sprints (paginated) [any role]
  GET    /sprints/{sprint_id}               → get a single sprint         [any role]
  GET    /projects/{project_id}/sprints     → list sprints for a project  [any role]
  PUT    /sprints/{sprint_id}               → full update a sprint        [scrum_master]
  PATCH  /sprints/{sprint_id}/status        → update sprint status        [scrum_master]
  DELETE /sprints/{sprint_id}               → delete a sprint             [scrum_master]
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.sprints.schemas import (
    SprintCreate,
    SprintUpdate,
    SprintStatusUpdate,
    SprintResponse,
)
from app.sprints import service as sprint_service

router = APIRouter(tags=["Sprints"])


# ── Create ────────────────────────────────────────────────────


@router.post(
    "/sprints",
    response_model=SprintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new sprint",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def create_sprint(
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new sprint under an existing project.

    **Requires role:** `scrum_master`

    Validations:
    - `project_id` must reference an existing project (404 otherwise).
    - `end_date` must be strictly after `start_date` (422 otherwise).
    """
    return sprint_service.create_sprint(db, sprint_data)


# ── Read (all – paginated) ──────────────────────────────────


@router.get(
    "/sprints",
    response_model=list[SprintResponse],
    summary="List all sprints",
)
def list_all_sprints(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all sprints with optional pagination (skip / limit)."""
    return sprint_service.get_all_sprints(db, skip=skip, limit=limit)


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


# ── Full Update ──────────────────────────────────────────────


@router.put(
    "/sprints/{sprint_id}",
    response_model=SprintResponse,
    summary="Update a sprint",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def update_sprint(
    sprint_id: UUID,
    sprint_data: SprintUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing sprint. Only the provided fields will be changed.

    **Requires role:** `scrum_master`

    Validations:
    - Sprint must exist (404 otherwise).
    - If both `start_date` and `end_date` are supplied, `end_date` must be
      strictly after `start_date` (422 otherwise).
    """
    return sprint_service.update_sprint(db, sprint_id, sprint_data)


# ── Update Status ────────────────────────────────────────────


@router.patch(
    "/sprints/{sprint_id}/status",
    response_model=SprintResponse,
    summary="Update sprint status",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def update_sprint_status(
    sprint_id: UUID,
    payload: SprintStatusUpdate,
    db: Session = Depends(get_db),
):
    """
    Update the status of an existing sprint.

    **Requires role:** `scrum_master`

    Allowed values: `planned`, `active`, `completed`.
    Returns 404 if the sprint does not exist.
    """
    return sprint_service.update_sprint_status(db, sprint_id, payload.status)


# ── Delete ───────────────────────────────────────────────────


@router.delete(
    "/sprints/{sprint_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a sprint",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def delete_sprint(
    sprint_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Delete a sprint by its UUID.

    **Requires role:** `scrum_master`

    Returns 404 if the sprint does not exist.
    """
    return sprint_service.delete_sprint(db, sprint_id)
