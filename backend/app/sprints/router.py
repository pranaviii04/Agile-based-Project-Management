"""
Sprints Router
--------------
API endpoints for sprint management.

Sprints are nested under projects:
  POST   /sprints/                        → create a new sprint
  GET    /sprints/?project_id={id}        → list sprints for a project
  GET    /sprints/{id}                    → get a single sprint
  PUT    /sprints/{id}                    → update a sprint
  DELETE /sprints/{id}                    → delete a sprint

NOTE: Route handlers are scaffolded but NOT implemented yet.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.sprints.schemas import SprintCreate, SprintUpdate, SprintResponse

router = APIRouter(prefix="/sprints", tags=["Sprints"])


# ── Create ────────────────────────────────────────────────────


@router.post(
    "/",
    response_model=SprintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new sprint",
)
def create_sprint(
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sprint under an existing project."""
    # TODO: implement via service layer
    ...


# ── Read (list by project) ───────────────────────────────────


@router.get(
    "/",
    response_model=list[SprintResponse],
    summary="List sprints for a project",
)
def list_sprints(
    project_id: int = Query(..., description="Filter sprints by project ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all sprints belonging to the specified project."""
    # TODO: implement via service layer
    ...


# ── Read (single) ────────────────────────────────────────────


@router.get(
    "/{sprint_id}",
    response_model=SprintResponse,
    summary="Get a sprint by ID",
)
def get_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single sprint by its ID."""
    # TODO: implement via service layer
    ...


# ── Update ────────────────────────────────────────────────────


@router.put(
    "/{sprint_id}",
    response_model=SprintResponse,
    summary="Update a sprint",
)
def update_sprint(
    sprint_id: int,
    sprint_data: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing sprint's details."""
    # TODO: implement via service layer
    ...


# ── Delete ────────────────────────────────────────────────────


@router.delete(
    "/{sprint_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a sprint",
)
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a sprint by ID."""
    # TODO: implement via service layer
    ...
