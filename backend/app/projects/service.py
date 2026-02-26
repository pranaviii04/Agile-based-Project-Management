"""
Project Service
---------------
Business-logic layer for project operations.
All database interactions for projects live here, keeping routers thin.

NOTE: Business logic is NOT implemented yet — only function signatures
are scaffolded so the module is importable and testable.
"""

from sqlalchemy.orm import Session

from app.projects.models import Project
from app.projects.schemas import ProjectCreate, ProjectUpdate


def create_project(db: Session, project_data: ProjectCreate, owner_id: int) -> Project:
    """Create a new project owned by the given user."""
    raise NotImplementedError


def get_project(db: Session, project_id: int) -> Project | None:
    """Return a single project by ID, or None if not found."""
    raise NotImplementedError


def get_projects(db: Session, skip: int = 0, limit: int = 100) -> list[Project]:
    """Return a paginated list of projects."""
    raise NotImplementedError


def get_projects_by_owner(db: Session, owner_id: int) -> list[Project]:
    """Return all projects owned by a specific user."""
    raise NotImplementedError


def update_project(db: Session, project_id: int, project_data: ProjectUpdate) -> Project | None:
    """Update an existing project. Returns None if project not found."""
    raise NotImplementedError


def delete_project(db: Session, project_id: int) -> bool:
    """Delete a project by ID. Returns True if deleted, False if not found."""
    raise NotImplementedError
