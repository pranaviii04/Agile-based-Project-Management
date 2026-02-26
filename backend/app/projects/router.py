"""
Projects Router
---------------
API endpoints for project management.

Endpoints:
  POST   /projects/              → create a new project
  GET    /projects/              → list all projects (paginated)
  GET    /projects/{project_id}  → get a single project by UUID
  PUT    /projects/{project_id}  → update a project (partial)
  DELETE /projects/{project_id}  → delete a project
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.projects.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDeleteResponse,
)
from app.projects import service as project_service

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
):
    """Create a new project and return it."""
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
):
    """Return a single project by its UUID. Returns 404 if not found."""
    return project_service.get_project_by_id(db, project_id)


# ── Update ────────────────────────────────────────────────────


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
)
def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing project. Only provided fields are changed."""
    return project_service.update_project(db, project_id, project_data)


# ── Delete ────────────────────────────────────────────────────


@router.delete(
    "/{project_id}",
    response_model=ProjectDeleteResponse,
    summary="Delete a project",
)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    """Delete a project by its UUID. Returns 404 if not found."""
    return project_service.delete_project(db, project_id)
