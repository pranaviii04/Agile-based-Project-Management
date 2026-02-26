"""
Project Service
---------------
Business-logic layer for project operations.
All database interactions for projects live here, keeping routers thin.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.projects.models import Project
from app.projects.schemas import ProjectCreate, ProjectUpdate


def create_project(db: Session, project_data: ProjectCreate) -> Project:
    """Create a new project and persist it to the database."""
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


def get_all_projects(db: Session, skip: int = 0, limit: int = 10) -> list[Project]:
    """Return a paginated list of projects ordered by creation date (newest first)."""
    return (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_project_by_id(db: Session, project_id: UUID) -> Project:
    """
    Return a single project by its UUID.
    Raises 404 if not found.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id '{project_id}' not found.",
        )
    return project


def update_project(db: Session, project_id: UUID, project_data: ProjectUpdate) -> Project:
    """
    Update an existing project with only the provided fields.
    Raises 404 if the project does not exist.
    """
    project = get_project_by_id(db, project_id)

    # Update only the fields that were explicitly provided
    update_fields = project_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(project, field, value)

    # Manually bump updated_at timestamp
    project.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: UUID) -> dict:
    """
    Delete a project by its UUID.
    Raises 404 if the project does not exist.
    Returns a success message dict.
    """
    project = get_project_by_id(db, project_id)

    db.delete(project)
    db.commit()

    return {"message": "Project deleted successfully"}
