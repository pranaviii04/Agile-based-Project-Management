"""
Sprint Service
--------------
Business-logic layer for sprint operations.
All database interactions for sprints live here, keeping routers thin.

NOTE: Business logic is NOT implemented yet — only function signatures
are scaffolded so the module is importable and testable.
"""

from sqlalchemy.orm import Session

from app.sprints.models import Sprint
from app.sprints.schemas import SprintCreate, SprintUpdate


def create_sprint(db: Session, sprint_data: SprintCreate) -> Sprint:
    """Create a new sprint under an existing project."""
    raise NotImplementedError


def get_sprint(db: Session, sprint_id: int) -> Sprint | None:
    """Return a single sprint by ID, or None if not found."""
    raise NotImplementedError


def get_sprints_by_project(db: Session, project_id: int) -> list[Sprint]:
    """Return all sprints belonging to a project."""
    raise NotImplementedError


def update_sprint(db: Session, sprint_id: int, sprint_data: SprintUpdate) -> Sprint | None:
    """Update an existing sprint. Returns None if sprint not found."""
    raise NotImplementedError


def delete_sprint(db: Session, sprint_id: int) -> bool:
    """Delete a sprint by ID. Returns True if deleted, False if not found."""
    raise NotImplementedError
