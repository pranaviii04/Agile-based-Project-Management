"""
Project Service
---------------
Business-logic layer for project operations.
All database interactions for projects live here, keeping routers thin.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import status
from sqlalchemy.orm import Session

from app.exceptions import raise_error

from app.projects.models import Project
from app.projects.schemas import ProjectCreate, ProjectUpdate
from app.sprints.models import Sprint
from app.tasks.models import Task, TaskStatus
from app.cpm.service import run_cpm_for_sprint


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
        raise_error(
            status.HTTP_404_NOT_FOUND,
            f"Project with id '{project_id}' not found.",
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


def generate_project_report(db: Session, project_id: UUID) -> dict:
    """
    Generate aggregated analytics for a project.
    Calculates completion percentages across tasks in ONE query, avoiding N+1.
    Calls CPM analysis for the latest sprint.
    """
    # 1. Validate project exists
    project = get_project_by_id(db, project_id)

    # 2. Fetch all sprints
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    total_sprints = len(sprints)

    if total_sprints == 0:
        return {
            "project_id": str(project_id),
            "total_sprints": 0,
            "total_tasks": 0,
            "completed_tasks": 0,
            "ongoing_tasks": 0,
            "todo_tasks": 0,
            "average_sprint_completion_percentage": 0,
            "latest_sprint": None
        }

    sprint_ids = [s.id for s in sprints]
    
    # 3. Fetch all tasks across those sprints in ONE query
    tasks = db.query(Task).filter(Task.sprint_id.in_(sprint_ids)).all()
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.DONE)
    ongoing_tasks = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
    todo_tasks = sum(1 for t in tasks if t.status == TaskStatus.TODO)

    # 4. Group tasks by sprint
    sprint_tasks_map = {s_id: [] for s_id in sprint_ids}
    for t in tasks:
        sprint_tasks_map[t.sprint_id].append(t)

    # 5. Calculate average sprint completion
    sprint_completions = []
    for s_id, s_tasks in sprint_tasks_map.items():
        if not s_tasks:
            sprint_completions.append(0)
        else:
            s_completed = sum(1 for t in s_tasks if t.status == TaskStatus.DONE)
            sprint_completions.append((s_completed / len(s_tasks)) * 100)

    avg_sprint_completion = round(sum(sprint_completions) / total_sprints)

    # 6. Identify latest sprint directly using created_at
    latest_sprint = max(sprints, key=lambda s: s.created_at)

    # 7. CPM calculation for the latest sprint ONLY if it has tasks
    latest_sprint_report = None
    if sprint_tasks_map[latest_sprint.id]:
        cpm_result = run_cpm_for_sprint(latest_sprint.id, db)
        latest_sprint_report = {
            "sprint_id": str(latest_sprint.id),
            "critical_tasks": cpm_result["critical_tasks"],
            "project_duration": cpm_result["project_duration"]
        }

    # 8. Return final object
    return {
        "project_id": str(project_id),
        "total_sprints": total_sprints,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "ongoing_tasks": ongoing_tasks,
        "todo_tasks": todo_tasks,
        "average_sprint_completion_percentage": avg_sprint_completion,
        "latest_sprint": latest_sprint_report
    }
