"""
Task & Dependency Service
--------------------------
Business-logic layer for task and dependency operations.
All database interactions live here, keeping routers thin.
"""

from collections import deque
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.sprints.models import Sprint
from app.tasks.models import Task, TaskDependency, TaskStatus
from app.tasks.schemas import TaskCreate, TaskUpdate, CPMTaskData


# ── Helpers ───────────────────────────────────────────────────


def _get_sprint_or_404(db: Session, sprint_id: UUID) -> Sprint:
    """Return the Sprint or raise 404."""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if sprint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sprint with id '{sprint_id}' not found.",
        )
    return sprint


def _get_task_or_404(db: Session, task_id: UUID) -> Task:
    """Return the Task or raise 404."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found.",
        )
    return task


def _get_dependency_or_404(db: Session, dependency_id: UUID) -> TaskDependency:
    """Return the TaskDependency or raise 404."""
    dep = db.query(TaskDependency).filter(TaskDependency.id == dependency_id).first()
    if dep is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dependency with id '{dependency_id}' not found.",
        )
    return dep


def _check_circular_dependency(
    db: Session, task_id: UUID, depends_on_task_id: UUID
) -> None:
    """
    BFS-based cycle detection.
    Starting from `depends_on_task_id`, follow its dependencies.
    If we reach `task_id`, adding this edge would create a cycle.
    """
    visited: set[UUID] = set()
    queue: deque[UUID] = deque([depends_on_task_id])

    while queue:
        current = queue.popleft()
        if current == task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Adding this dependency would create a circular dependency.",
            )
        if current in visited:
            continue
        visited.add(current)

        # Get all tasks that `current` depends on
        deps = (
            db.query(TaskDependency.depends_on_task_id)
            .filter(TaskDependency.task_id == current)
            .all()
        )
        for (dep_id,) in deps:
            if dep_id not in visited:
                queue.append(dep_id)


# ── Task CRUD ─────────────────────────────────────────────────


def create_task(db: Session, task_data: TaskCreate) -> Task:
    """
    Create a new task under an existing sprint.

    Validations:
      • sprint_id must reference an existing sprint.
      • duration must be > 0 (enforced by schema).
    """
    _get_sprint_or_404(db, task_data.sprint_id)

    new_task = Task(
        name=task_data.name,
        description=task_data.description,
        duration=task_data.duration,
        priority=task_data.priority,
        status=task_data.status,
        sprint_id=task_data.sprint_id,
        assigned_to=task_data.assigned_to,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def get_task_by_id(db: Session, task_id: UUID) -> Task:
    """Return a single task by UUID. Raises 404 if not found."""
    return _get_task_or_404(db, task_id)


def get_tasks_by_sprint(
    db: Session, sprint_id: UUID, skip: int = 0, limit: int = 10
) -> list[Task]:
    """
    Return all tasks belonging to a sprint with pagination.
    Raises 404 if the sprint does not exist.
    """
    _get_sprint_or_404(db, sprint_id)

    return (
        db.query(Task)
        .filter(Task.sprint_id == sprint_id)
        .order_by(Task.priority.desc(), Task.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_task(db: Session, task_id: UUID, task_data: TaskUpdate) -> Task:
    """
    Update a task (only provided fields are changed).
    Raises 404 if the task does not exist.
    """
    task = _get_task_or_404(db, task_id)

    update_fields = task_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task_id: UUID, new_status: TaskStatus) -> Task:
    """
    Update only the status of a task.
    Raises 404 if the task does not exist.
    """
    task = _get_task_or_404(db, task_id)

    task.status = new_status
    task.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: UUID) -> dict:
    """
    Delete a task by UUID.
    Raises 404 if the task does not exist.
    """
    task = _get_task_or_404(db, task_id)

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}


# ── Dependency CRUD ───────────────────────────────────────────


def create_dependency(
    db: Session, task_id: UUID, depends_on_task_id: UUID
) -> TaskDependency:
    """
    Create a dependency: `task_id` depends on `depends_on_task_id`.

    Validations:
      • No self-dependency.
      • Both tasks must exist.
      • Both tasks must belong to the same sprint.
      • The pair must be unique.
      • Adding this edge must not create a cycle.
    """
    # No self-dependency
    if task_id == depends_on_task_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task cannot depend on itself.",
        )

    task = _get_task_or_404(db, task_id)
    depends_on = _get_task_or_404(db, depends_on_task_id)

    # Same sprint check
    if task.sprint_id != depends_on.sprint_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both tasks must belong to the same sprint.",
        )

    # Duplicate check
    existing = (
        db.query(TaskDependency)
        .filter(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_task_id == depends_on_task_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This dependency already exists.",
        )

    # Circular dependency check
    _check_circular_dependency(db, task_id, depends_on_task_id)

    new_dep = TaskDependency(
        task_id=task_id,
        depends_on_task_id=depends_on_task_id,
    )
    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)
    return new_dep


def get_dependencies_by_task(db: Session, task_id: UUID) -> list[TaskDependency]:
    """
    Return all dependencies for a given task (its predecessors).
    Raises 404 if the task does not exist.
    """
    _get_task_or_404(db, task_id)

    return (
        db.query(TaskDependency)
        .filter(TaskDependency.task_id == task_id)
        .order_by(TaskDependency.created_at.asc())
        .all()
    )


def delete_dependency(db: Session, dependency_id: UUID) -> dict:
    """
    Delete a dependency by its UUID.
    Raises 404 if the dependency does not exist.
    """
    dep = _get_dependency_or_404(db, dependency_id)

    db.delete(dep)
    db.commit()

    return {"message": "Dependency deleted successfully"}


# ── CPM Integration ───────────────────────────────────────────


def get_tasks_for_cpm(db: Session, sprint_id: UUID) -> list[CPMTaskData]:
    """
    Return all tasks in a sprint formatted for the CPM engine.

    Output format:
    [
      {"id": "<uuid>", "name": "...", "duration": 5, "dependencies": ["<uuid>", ...]},
      ...
    ]

    Does NOT run CPM — only prepares the data.
    """
    _get_sprint_or_404(db, sprint_id)

    tasks = (
        db.query(Task)
        .filter(Task.sprint_id == sprint_id)
        .all()
    )

    result: list[CPMTaskData] = []
    for task in tasks:
        dep_ids = [
            str(d.depends_on_task_id)
            for d in task.dependencies
        ]
        result.append(
            CPMTaskData(
                id=str(task.id),
                name=task.name,
                duration=task.duration,
                dependencies=dep_ids,
            )
        )

    return result
