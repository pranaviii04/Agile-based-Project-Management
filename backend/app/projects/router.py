"""
Projects Router
---------------
API endpoints for project management.

Endpoints:
  POST   /projects/              → create a new project    [admin]
  GET    /projects/              → list all projects        [any role]
  GET    /projects/{project_id}  → get a single project     [any role]
  PUT    /projects/{project_id}  → update a project         [admin]
  DELETE /projects/{project_id}  → delete a project         [admin]
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.projects.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDeleteResponse,
    ProjectReportResponse,
)
from app.projects import service as project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


# ── Create ────────────────────────────────────────────────────


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new project and return it.

    **Requires role:** `admin`
    """
    return project_service.create_project(db, project_data)


# ── Read (list) ───────────────────────────────────────────────


@router.get(
    "/",
    response_model=list[ProjectResponse],
    summary="List all projects",
)
def list_projects(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a paginated list of projects ordered by creation date (newest first)."""
    return project_service.get_all_projects(db, skip=skip, limit=limit)


# ── Read (single) ────────────────────────────────────────────


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a project by ID",
)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single project by its UUID. Returns 404 if not found."""
    return project_service.get_project_by_id(db, project_id)


# ── Update ────────────────────────────────────────────────────


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing project. Only provided fields are changed.

    **Requires role:** `admin`
    """
    return project_service.update_project(db, project_id, project_data)


# ── Delete ────────────────────────────────────────────────────


@router.delete(
    "/{project_id}",
    response_model=ProjectDeleteResponse,
    summary="Delete a project",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Delete a project by its UUID. Returns 404 if not found.

    **Requires role:** `admin`
    """
    return project_service.delete_project(db, project_id)


# ── Analytics & Reporting ─────────────────────────────────────


@router.get(
    "/{project_id}/report",
    response_model=ProjectReportResponse,
    summary="Get project-level report & analytics",
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.SCRUM_MASTER))],
)
def get_project_report(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate aggregated analytics for a project.

    **Requires role:** `admin` or `scrum_master`
    Raises 404 if project not found.
    Raises 400 if CPM analysis fails on the latest sprint.
    """
    return project_service.generate_project_report(db, project_id)
