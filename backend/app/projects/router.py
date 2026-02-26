"""
Projects Router
---------------
API endpoints for project management.

Endpoints (scaffolded — handlers delegate to service layer):
  POST   /projects/          → create a new project
  GET    /projects/          → list all projects
  GET    /projects/{id}      → get a single project
  PUT    /projects/{id}      → update a project
  DELETE /projects/{id}      → delete a project

NOTE: Route handlers are scaffolded but NOT implemented yet.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.projects.schemas import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])


# ── Create ────────────────────────────────────────────────────


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project. The authenticated user becomes the owner."""
    # TODO: implement via service layer
    ...


# ── Read (list) ───────────────────────────────────────────────


@router.get(
    "/",
    response_model=list[ProjectResponse],
    summary="List all projects",
)
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a paginated list of projects visible to the current user."""
    # TODO: implement via service layer
    ...


# ── Read (single) ────────────────────────────────────────────


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a project by ID",
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single project by its ID."""
    # TODO: implement via service layer
    ...


# ── Update ────────────────────────────────────────────────────


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing project's details."""
    # TODO: implement via service layer
    ...


# ── Delete ────────────────────────────────────────────────────


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project by ID. Only the owner or an admin may delete."""
    # TODO: implement via service layer
    ...
