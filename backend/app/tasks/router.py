"""
Tasks & Dependencies Router
-----------------------------
API endpoints for task and dependency management.

Task Endpoints:
  POST   /tasks                           → create a task              [scrum_master]
  GET    /tasks/{task_id}                  → get a task by ID           [any role]
  GET    /sprints/{sprint_id}/tasks        → list tasks for a sprint   [any role]
  PUT    /tasks/{task_id}                  → update a task              [scrum_master]
  PATCH  /tasks/{task_id}/status           → update task status         [any role]
  DELETE /tasks/{task_id}                  → delete a task              [scrum_master]

Dependency Endpoints:
  POST   /tasks/{task_id}/dependencies     → create a dependency       [scrum_master]
  GET    /tasks/{task_id}/dependencies     → list dependencies         [any role]
  DELETE /dependencies/{dependency_id}     → delete a dependency       [scrum_master]

CPM Endpoint:
  GET    /sprints/{sprint_id}/tasks/cpm    → CPM-formatted task data   [any role]
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.tasks.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskResponse,
    TaskDependencyCreate,
    TaskDependencyResponse,
    CPMTaskData,
)
from app.tasks.models import TaskStatus
from app.tasks import service as task_service

router = APIRouter(tags=["Tasks"])


# ═══════════════════════════════════════════════════════════════
#  TASK ENDPOINTS
# ═══════════════════════════════════════════════════════════════


# ── Create Task ───────────────────────────────────────────────


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new task under an existing sprint.

    **Requires role:** `scrum_master`

    Validations:
    - `sprint_id` must reference an existing sprint (404 otherwise).
    - `duration` must be > 0 (422 otherwise).
    """
    return task_service.create_task(db, task_data)


# ── Read My Tasks ────────────────────────────────────────────


@router.get(
    "/tasks/my",
    response_model=list[TaskResponse],
    summary="Get user's assigned tasks",
    dependencies=[Depends(require_role(UserRole.TEAM_MEMBER, UserRole.SCRUM_MASTER, UserRole.ADMIN))],
)
def get_my_tasks(
    status: TaskStatus = Query(None, description="Filter by task status (e.g., TODO, IN_PROGRESS, DONE)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all tasks assigned directly to the authenticated user.
    Optionally filter the resulting list by a specific `status`.
    
    **Requires role:** `team_member`, `scrum_master`, or `admin`
    """
    return task_service.get_tasks_assigned_to_user(db, current_user.id, status)


# ── Read Task (single) ───────────────────────────────────────


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get a task by ID",
)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single task by its UUID. Returns 404 if not found."""
    return task_service.get_task_by_id(db, task_id)


# ── Read Tasks (by sprint – paginated) ───────────────────────


@router.get(
    "/sprints/{sprint_id}/tasks",
    response_model=list[TaskResponse],
    summary="List tasks for a sprint",
)
def list_tasks_by_sprint(
    sprint_id: UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all tasks belonging to the specified sprint, ordered by
    priority (desc) then creation date. Returns 404 if the sprint
    does not exist.
    """
    return task_service.get_tasks_by_sprint(db, sprint_id, skip=skip, limit=limit)


# ── Update Task (full) ───────────────────────────────────────


@router.put(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update a task",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing task. Only the provided fields will be changed.

    **Requires role:** `scrum_master`
    """
    return task_service.update_task(db, task_id, task_data)


# ── Update Task Status ───────────────────────────────────────


@router.patch(
    "/tasks/{task_id}/status",
    response_model=TaskResponse,
    summary="Update task status",
)
def update_task_status(
    task_id: UUID,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the status of an existing task.

    Allowed values: `todo`, `in_progress`, `done`.
    Any authenticated user can update task status.
    Returns 404 if the task does not exist.
    """
    return task_service.update_task_status(db, task_id, payload.status)


# ── Delete Task ───────────────────────────────────────────────


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Delete a task by its UUID.

    **Requires role:** `scrum_master`

    Returns 404 if the task does not exist.
    """
    return task_service.delete_task(db, task_id)


# ═══════════════════════════════════════════════════════════════
#  DEPENDENCY ENDPOINTS
# ═══════════════════════════════════════════════════════════════


# ── Create Dependency ─────────────────────────────────────────


@router.post(
    "/tasks/{task_id}/dependencies",
    response_model=TaskDependencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task dependency",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def create_dependency(
    task_id: UUID,
    dep_data: TaskDependencyCreate,
    db: Session = Depends(get_db),
):
    """
    Add a dependency: `task_id` depends on `depends_on_task_id`.

    **Requires role:** `scrum_master`

    Validations:
    - No self-dependency.
    - Both tasks must belong to the same sprint.
    - No duplicate dependencies.
    - No circular dependencies.
    """
    return task_service.create_dependency(db, task_id, dep_data.depends_on_task_id)


# ── List Dependencies ────────────────────────────────────────


@router.get(
    "/tasks/{task_id}/dependencies",
    response_model=list[TaskDependencyResponse],
    summary="List dependencies for a task",
)
def list_dependencies(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all dependencies (predecessors) for the given task.
    Returns 404 if the task does not exist.
    """
    return task_service.get_dependencies_by_task(db, task_id)


# ── Delete Dependency ─────────────────────────────────────────


@router.delete(
    "/dependencies/{dependency_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a dependency",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def delete_dependency(
    dependency_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Delete a dependency by its UUID.

    **Requires role:** `scrum_master`

    Returns 404 if the dependency does not exist.
    """
    return task_service.delete_dependency(db, dependency_id)


# ═══════════════════════════════════════════════════════════════
#  CPM DATA ENDPOINT
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/sprints/{sprint_id}/tasks/cpm",
    response_model=list[CPMTaskData],
    summary="Get tasks formatted for CPM analysis",
)
def get_tasks_for_cpm(
    sprint_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all tasks in a sprint formatted for the CPM engine.
    Does NOT run CPM — only prepares the data.
    Returns 404 if the sprint does not exist.
    """
    return task_service.get_tasks_for_cpm(db, sprint_id)
