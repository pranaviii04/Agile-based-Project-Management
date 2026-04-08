"""
CPM Service Layer
-----------------
Bridges the pure CPM engine with the rest of the application.
Fetches tasks and dependencies from the database to run CPM analysis.
"""

from uuid import UUID
from typing import Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.cpm.engine import run_cpm
from app.sprints.models import Sprint
from app.tasks.models import Task, TaskDependency


def run_cpm_for_sprint(sprint_id: UUID, db: Session) -> Dict:
    """
    Executes the CPM engine for a specific sprint by pulling tasks from the database.
    
    Args:
        sprint_id: The identifier for the sprint.
        db: The SQLAlchemy database session.
        
    Returns:
        A dictionary containing the sprint_id, project_duration,
        critical_tasks list, and slack_values for each task.
    """
        
    # 1. Validate sprint exists
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sprint {sprint_id} not found."
        )

    # 2. Fetch all tasks for the sprint 
    tasks_records = db.query(Task).filter(Task.sprint_id == sprint_id).all()
    if not tasks_records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tasks found for this sprint."
        )

    # 3. Fetch dependencies (avoiding N+1 queries)
    # TODO: Optimize further by eager loading if task count is extremely large
    task_ids = [task.id for task in tasks_records]
    dependencies = db.query(TaskDependency).filter(TaskDependency.task_id.in_(task_ids)).all()

    # Map task_id to a list of the tasks it depends on (depends_on_task_id)
    dep_map = {task.id: [] for task in tasks_records}
    for dep in dependencies:
        dep_map[dep.task_id].append(str(dep.depends_on_task_id))

    # 4. Convert DB records into CPM engine format
    cpm_tasks = []
    for task in tasks_records:
        cpm_tasks.append({
            "id": str(task.id),
            "duration": task.duration,
            "dependencies": dep_map[task.id]
        })

    # 5. Call pure algorithm logic
    result = run_cpm(cpm_tasks)
    
    # Use task IDs (strings) as keys — the frontend matches against task.id
    # Extract slack values keyed by task UUID
    slack_values = {
        task_id: task_data["slack"]
        for task_id, task_data in result["tasks"].items()
    }
    
    # 6. Format and return
    return {
        "sprint_id": str(sprint_id),
        "project_duration": result["project_duration"],
        "critical_tasks": result["critical_path"],
        "slack_values": slack_values
    }

