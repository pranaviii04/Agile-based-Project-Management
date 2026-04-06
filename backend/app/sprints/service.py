"""
Sprint Service
--------------
Business-logic layer for sprint operations.
All database interactions for sprints live here, keeping routers thin.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import status
from sqlalchemy.orm import Session

from app.exceptions import raise_error

from app.projects.models import Project
from app.sprints.models import Sprint, SprintStatus
from app.sprints.schemas import SprintCreate, SprintUpdate
from app.tasks.models import Task, TaskStatus


# ── Helpers ───────────────────────────────────────────────────


def _validate_project_exists(db: Session, project_id: UUID) -> Project:
    """Return the Project or raise 404 if it doesn't exist."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise_error(
            status.HTTP_404_NOT_FOUND,
            f"Project with id '{project_id}' not found.",
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


def get_all_sprints(db: Session, skip: int = 0, limit: int = 10) -> list[Sprint]:
    """
    Return all sprints with pagination support.
    """
    return (
        db.query(Sprint)
        .order_by(Sprint.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


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
        raise_error(
            status.HTTP_404_NOT_FOUND,
            f"Sprint with id '{sprint_id}' not found.",
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


def update_sprint(db: Session, sprint_id: UUID, sprint_data: SprintUpdate) -> Sprint:
    """
    Full update of a sprint (only provided fields are changed).

    Validations:
      • Sprint must exist (404 otherwise).
      • If both start_date and end_date are supplied, end_date > start_date
        (enforced by the SprintUpdate schema validator).
    """
    sprint = get_sprint_by_id(db, sprint_id)

    update_fields = sprint_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(sprint, field, value)

    sprint.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(sprint)
    return sprint


def delete_sprint(db: Session, sprint_id: UUID) -> dict:
    """
    Delete a sprint by its UUID.
    Raises 404 if the sprint does not exist.
    Returns a success message dict.
    """
    sprint = get_sprint_by_id(db, sprint_id)

    db.delete(sprint)
    db.commit()
    return {"message": "Sprint deleted successfully"}


def get_sprint_progress(db: Session, sprint_id: UUID) -> dict:
    """
    Calculate sprint progress metrics based on task statuses.
    Raises 404 if the sprint does not exist.
    """
    # 1. Validate sprint exists
    sprint = get_sprint_by_id(db, sprint_id)
    
    # 2. Fetch all tasks for sprint in ONE query
    tasks = db.query(Task).filter(Task.sprint_id == sprint_id).all()
    
    # 3. If no tasks, return zeroes
    if not tasks:
        return {
            "sprint_id": sprint_id,
            "total_tasks": 0,
            "completed_tasks": 0,
            "in_progress_tasks": 0,
            "todo_tasks": 0,
            "completion_percentage": 0
        }
        
    # 4. Count tasks
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.DONE)
    in_progress_tasks = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
    todo_tasks = sum(1 for t in tasks if t.status == TaskStatus.TODO)
    
    # 5. Calculate percentage (rounded to nearest integer)
    completion_percentage = round((completed_tasks / total_tasks) * 100)
    
    # Optional Enhancement: Auto-complete sprint if all tasks are done
    if completed_tasks == total_tasks and total_tasks > 0 and sprint.status != SprintStatus.COMPLETED:
        sprint.status = SprintStatus.COMPLETED
        sprint.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(sprint)
    
    # 6. Return response
    return {
        "sprint_id": sprint_id,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "todo_tasks": todo_tasks,
        "completion_percentage": completion_percentage
    }
