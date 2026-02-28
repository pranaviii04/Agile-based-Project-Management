"""
CPM Router
----------
Exposes the single HTTP endpoint to execute CPM scheduling analysis.
Maintains a strict separation of concerns—no business logic or algorithm
details live here.
"""

from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.cpm.service import run_cpm_for_sprint
from app.auth.permissions import require_role
from app.models.user import UserRole


router = APIRouter(prefix="/sprints", tags=["CPM"])


# ── Endpoint Schemas ──────────────────────────────────────────

class TaskInput(BaseModel):
    id: str
    duration: int
    dependencies: List[str] = []

class CPMRequest(BaseModel):
    tasks: List[TaskInput]

class CPMResponse(BaseModel):
    sprint_id: str
    project_duration: int
    critical_tasks: List[str]
    slack_values: Dict[str, int]


# ── Routes ────────────────────────────────────────────────────

@router.post(
    "/{sprint_id}/cpm",
    response_model=CPMResponse,
    summary="Run CPM Analysis for a Sprint",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def execute_cpm(sprint_id: str, payload: CPMRequest):
    """
    Executes the Critical Path Method (CPM) algorithm.
    
    **Requires role:** `scrum_master`
    
    Currently expects a JSON body containing the list of tasks and their dependencies.
    """
    if not payload.tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tasks list cannot be empty."
        )

    try:
        # Convert Pydantic objects to standard dictionaries for the pure python engine
        tasks_data = [task.model_dump() for task in payload.tasks]
        
        # Execute the pure business logic service layer
        result = run_cpm_for_sprint(sprint_id, tasks_data)
        return result
        
    except ValueError as e:
        # Catch engine / service validation errors and return as 400 Bad Request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
