"""
Sprint Service
--------------
Business-logic layer for sprint operations.
All database interactions for sprints live here, keeping routers thin.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.projects.models import Project
from app.sprints.models import Sprint, SprintStatus
from app.sprints.schemas import SprintCreate


# ── Helpers ───────────────────────────────────────────────────


def _validate_project_exists(db: Session, project_id: UUID) -> Project:
    """Return the Project or raise 404 if it doesn't exist."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id '{project_id}' not found.",
        )
    return project


# ── CRUD ──────────────────────────────────────────────────────


def create_sprint(db: Session, sprint_data: SprintCreate) -> Sprint:
    """
    Create a new sprint under an existing project.

    Validations:
      • project_id must reference an existing project.
      • end_date > start_date (handled by schema validator).
    """
    # Ensure the parent project exists
    _validate_project_exists(db, sprint_data.project_id)

    new_sprint = Sprint(
        name=sprint_data.name,
        project_id=sprint_data.project_id,
        start_date=sprint_data.start_date,
        end_date=sprint_data.end_date,
        status=sprint_data.status,
    )
    db.add(new_sprint)
    db.commit()
    db.refresh(new_sprint)
    return new_sprint


def get_sprints_by_project(db: Session, project_id: UUID) -> list[Sprint]:
    """
    Return all sprints belonging to a project, ordered by start_date.
    Raises 404 if the project does not exist.
    """
    _validate_project_exists(db, project_id)

    return (
        db.query(Sprint)
        .filter(Sprint.project_id == project_id)
        .order_by(Sprint.start_date.asc())
        .all()
    )


def get_sprint_by_id(db: Session, sprint_id: UUID) -> Sprint:
    """
    Return a single sprint by its UUID.
    Raises 404 if not found.
    """
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if sprint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sprint with id '{sprint_id}' not found.",
        )
    return sprint


def update_sprint_status(
    db: Session, sprint_id: UUID, new_status: SprintStatus
) -> Sprint:
    """
    Update the status of an existing sprint.
    Raises 404 if the sprint does not exist.
    """
    sprint = get_sprint_by_id(db, sprint_id)

    sprint.status = new_status
    sprint.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(sprint)
    return sprint
